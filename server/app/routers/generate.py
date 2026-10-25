import asyncio
import json
import logging
import re
import time
import uuid
from collections.abc import AsyncIterator
from pathlib import Path
from typing import Any

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from openai import OpenAIError
from pydantic import BaseModel, Field

from app import hermes, themes
from app.sse import TextBatch, sse
from app.routers.assess import Answer

router = APIRouter(tags=["generate"])

# Uvicorn's logger, so generation failures show up in the server terminal.
logger = logging.getLogger("uvicorn.error")

# Rules for the page Hermes writes; the {{...}} placeholders are filled with the student's data.
PROMPT = (Path(__file__).parent.parent / "prompts" / "generate_page.txt").read_text(encoding="utf-8")

# Upper limit for a whole generation, even if Hermes keeps sending keepalives.
GENERATE_TIMEOUT_SECONDS = 900

# Blocks the generated page from loading or sending anything over the network, so it can't leak data.
CSP = (
    '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; '
    "script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; "
    "font-src data:; media-src data: blob:; base-uri 'none'; form-action 'none'\">"
)

DOCTYPE = re.compile(r"<!doctype html[^>]*>", re.IGNORECASE)


class GenerateRequest(BaseModel):
    profile: dict[str, Any] = Field(description="Student profile from the intake form.")
    answers: list[Answer] = Field(description="Answers from the assessment questions.")
    material: str = Field(min_length=1, description="The learning material, or the topic to learn.")
    theme: themes.ThemeName = Field(
        default=themes.DEFAULT_THEME, description="The theme to build, usually the assessment's top pick."
    )


# Fills the prompt with the chosen theme's design and the student's data.
# The theme goes in first, so text inside the student's data can never be taken for a placeholder.
def fill_prompt(request: GenerateRequest) -> str:
    answers = [answer.model_dump() for answer in request.answers]
    return (
        PROMPT.replace("{{THEME}}", themes.THEMES[request.theme])
        .replace("{{PROFILE}}", json.dumps(request.profile, ensure_ascii=False, indent=2))
        .replace("{{ANSWERS}}", json.dumps(answers, ensure_ascii=False, indent=2))
        .replace("{{MATERIAL}}", request.material)
    )


# Pulls the HTML document out of the reply and puts our CSP first, so it applies before any generated script runs.
def prepare_page(reply: str) -> str | None:
    start = DOCTYPE.search(reply)
    end = reply.lower().rfind("</html>")
    if not start or end < start.end():
        return None
    # The CSP goes right after the doctype; anything before the doctype would switch the page to quirks mode.
    return start.group() + CSP + reply[start.end() : end + len("</html>")]


# Turns the reply so far into a short status line for the student.
# Before the page starts, show the last line Hermes wrote; once the page starts, show how much is written.
def progress_text(reply: str) -> str:
    start = DOCTYPE.search(reply)
    if start:
        return f"Die Seite wird geschrieben… {(len(reply) - start.start()) // 1000} KB"
    lines = [line.strip() for line in reply.splitlines() if line.strip()]
    return lines[-1][:200] if lines else "Denkt nach…"


# Runs one generation and yields server-sent events: "status" (the current step) and "reasoning" (Hermes thinking,
# in chunks) while Hermes works, then "done" with the page or "error".
async def generate_events(request: GenerateRequest) -> AsyncIterator[str]:
    started = time.monotonic()
    reply = ""
    status = "Hermes plant deine Seite…"
    yield sse("status", {"text": status})
    reasoning = TextBatch()
    try:
        async with asyncio.timeout(GENERATE_TIMEOUT_SECONDS):
            # A fresh session per generation, prefixed because the team shares one Hermes.
            async for kind, piece in hermes.stream_hermes(fill_prompt(request), session_id=f"lip-generate-{uuid.uuid4()}"):
                if kind == "reasoning":
                    if text := reasoning.add(piece):
                        yield sse("reasoning", {"text": text})
                    continue
                if kind == "tool":
                    new_status = piece
                else:
                    reply += piece
                    new_status = progress_text(reply)
                if new_status != status:
                    status = new_status
                    yield sse("status", {"text": status})
        if text := reasoning.flush():
            yield sse("reasoning", {"text": text})
    except TimeoutError:
        logger.warning("Generation timed out after %.0fs", time.monotonic() - started)
        yield sse("error", {"message": "Das hat zu lange gedauert. Versuch es gleich nochmal."})
        return
    except (hermes.HermesError, OpenAIError):
        logger.exception("Generation failed after %.0fs", time.monotonic() - started)
        yield sse("error", {"message": "Hermes antwortet gerade nicht. Versuch es nochmal."})
        return

    html = prepare_page(reply)
    if html is None:
        # Logs only the size, because the reply can repeat the student's needs data.
        logger.warning("Generation returned no page (%d characters)", len(reply))
        yield sse("error", {"message": "Hermes hat keine Seite geliefert. Versuch es nochmal."})
        return
    logger.info("Generation done in %.0fs, %d KB", time.monotonic() - started, len(html) // 1000)
    yield sse("done", {"html": html})


# Asks Hermes to write a learning page in the chosen theme for the student, streaming progress while it works.
@router.post("/generate")
async def generate(request: GenerateRequest) -> StreamingResponse:
    return StreamingResponse(generate_events(request), media_type="text/event-stream", headers={"Cache-Control": "no-cache"})
