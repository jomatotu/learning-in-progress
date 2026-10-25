import asyncio
import json
import logging
import uuid
from collections.abc import AsyncIterator
from pathlib import Path
from urllib.parse import urlsplit

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from openai import OpenAIError
from pydantic import BaseModel, Field

from app import hermes, learner
from app.routers.profile import Goal, Preferences, Student
from app.sse import TextBatch, sse

router = APIRouter(tags=["research"])

logger = logging.getLogger("uvicorn.error")

PROMPT = (Path(__file__).parent.parent / "prompts" / "research.txt").read_text(encoding="utf-8")

# Web research runs several searches and page reads, so it gets minutes, not seconds.
RESEARCH_TIMEOUT_SECONDS = 300

TOKENS_PER_UPDATE = 20

STATUS = "Hermes recherchiert, was dir beim Lernen hilft…"


# What Hermes needs to pick a research direction. The material's topic only, never its full text.
class ResearchRequest(BaseModel):
    student: Student
    goal: Goal
    topic: str = Field(default="", max_length=120)
    preferences: Preferences = Preferences()
    learning_instructions: dict[str, list[str]] = {}
    about_you: str = Field(default="", max_length=1000)
    student_id: learner.StudentId | None = None


class Finding(BaseModel):
    need: str = Field(description="One need of this student, in German with du.")
    strategy: str = Field(description="One evidence-based strategy for that need, in German with du.")
    how_to_apply: str = Field(description="How the app applies it to this student's material, in German with du.")
    source_title: str = Field(description="Title of the page or study you opened.")
    source_url: str = Field(description="Full http(s) URL of a page you opened in this session.")


class ResearchResult(BaseModel):
    findings: list[Finding] = Field(min_length=3, max_length=6)
    summary: str = Field(description="One or two sentences, in German with du, on what helps this student most.")


def is_web_url(url: str) -> bool:
    parts = urlsplit(url.strip())
    return parts.scheme in ("http", "https") and bool(parts.netloc)


# Renders findings as a compact block for later prompts (assessment, page generation).
def findings_block(findings: list[Finding]) -> str:
    return "\n".join(
        f"- {f.need}: {f.strategy} Anwendung: {f.how_to_apply} (Quelle: {f.source_title}, {f.source_url})"
        for f in findings
    )


# Lets Hermes research strategies for this student and yields server-sent events: "status" (progress and the
# tool it is using) and "reasoning" while it works, then "done" with the findings or "error".
async def research_events(request: ResearchRequest) -> AsyncIterator[str]:
    message = PROMPT.replace("{{DATA}}", json.dumps(request.model_dump(exclude={"student_id"}), ensure_ascii=False, indent=2))

    yield sse("status", {"text": STATUS})
    reasoning = TextBatch()
    try:
        async with asyncio.timeout(RESEARCH_TIMEOUT_SECONDS):
            async for kind, value in hermes.stream_hermes_json(
                message, schema=ResearchResult, session_id=f"lip-research-{uuid.uuid4()}"
            ):
                if kind == "tool":
                    yield sse("status", {"text": value})
                if kind == "reasoning" and (text := reasoning.add(value)):
                    yield sse("reasoning", {"text": text})
                if kind == "tokens" and value % TOKENS_PER_UPDATE == 0:
                    yield sse("status", {"text": f"{STATUS} ~{value} Wörter gedacht"})
                if kind == "result":
                    result = value
        if text := reasoning.flush():
            yield sse("reasoning", {"text": text})
    except TimeoutError:
        logger.warning("Research timed out")
        yield sse("error", {"message": "Die Recherche hat zu lange gedauert. Versuch es gleich nochmal."})
        return
    except (hermes.HermesError, OpenAIError):
        # Logs no details, because the reply can repeat the student's needs data.
        logger.warning("Research failed")
        yield sse("error", {"message": "Hermes hat nicht geantwortet. Versuch es nochmal."})
        return

    # Only real web links count as sources; anything else can't have been opened.
    findings = [f for f in result.findings if is_web_url(f.source_url)]
    # Kept for later sessions, so the next page starts from what was already found.
    if request.student_id and findings:
        learner.remember(request.student_id, "research", "; ".join(f"{f.strategy} ({f.source_url})" for f in findings))
    yield sse("done", {"findings": [f.model_dump() for f in findings], "summary": result.summary})


# Streams Hermes's web research on what helps this student learn, ending in cited findings.
@router.post("/research")
async def research(request: ResearchRequest) -> StreamingResponse:
    return StreamingResponse(
        research_events(request), media_type="text/event-stream", headers={"Cache-Control": "no-cache"}
    )
