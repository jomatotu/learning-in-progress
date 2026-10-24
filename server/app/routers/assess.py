import asyncio
import logging
import uuid
from collections.abc import AsyncIterator
from typing import Any

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from openai import OpenAIError
from pydantic import BaseModel, Field

from app import hermes
from app.sse import sse

router = APIRouter(tags=["assess"])

# Uvicorn's logger, so assessment failures show up in the server terminal.
logger = logging.getLogger("uvicorn.error")

# Upper limit on questions per student, so the assessment always ends.
MAX_QUESTIONS = 5

# Upper limit for one question, including a retry, even if Hermes keeps sending keepalives.
ASSESS_TIMEOUT_SECONDS = 300

# Sends a progress update every this many tokens, so the client isn't flooded with events.
TOKENS_PER_UPDATE = 20

STATUS = "Thinking about your answers…"

INSTRUCTIONS = f"""\
You help find out how a student learns best, so their learning material can be reshaped to fit them.
You get the student's profile (it may include challenges such as ADHD or dyslexia, goals, interests, \
and what already works for them) and the questions already answered.
Ask the single most useful next question. Keep it short and friendly, and offer 2 to 4 answer options.
Don't repeat earlier questions or ask about anything the profile already answers.
Set done to true once you know enough, or after {MAX_QUESTIONS} questions.
Write in the same language as the student profile.
Don't use any tools; answer only from the student data."""


class Answer(BaseModel):
    question: str
    answer: str


class AssessRequest(BaseModel):
    profile: dict[str, Any] = Field(description="Student profile, e.g. a persona file or intake form data.")
    answers: list[Answer] = []


class NextQuestion(BaseModel):
    done: bool = Field(description="True when no more questions are needed.")
    question: str = Field(description="The next question for the student. Empty when done.")
    options: list[str] = Field(description="2 to 4 short answer options. Empty when done.")


FINISHED = NextQuestion(done=True, question="", options=[])


# Asks Hermes for the next question and yields server-sent events: "status" with a token count while it works, then "done" or "error".
async def assess_events(request: AssessRequest) -> AsyncIterator[str]:
    if len(request.answers) >= MAX_QUESTIONS:
        yield sse("done", FINISHED.model_dump())
        return

    yield sse("status", {"text": STATUS})
    result = FINISHED
    try:
        async with asyncio.timeout(ASSESS_TIMEOUT_SECONDS):
            async for kind, value in hermes.stream_hermes_json(
                f"Student data:\n{request.model_dump_json()}",
                schema=NextQuestion,
                instructions=INSTRUCTIONS,
                # A fresh session per question, prefixed because the team shares one Hermes.
                session_id=f"lip-assess-{uuid.uuid4()}",
            ):
                if kind == "tokens" and value % TOKENS_PER_UPDATE == 0:
                    yield sse("status", {"text": f"{STATUS} ~{value} tokens"})
                if kind == "result":
                    result = value
    except TimeoutError:
        logger.warning("Assess timed out")
        yield sse("error", {"message": "Hermes took too long. Try again."})
        return
    except (hermes.HermesError, OpenAIError):
        # Logs no details, because the reply can repeat the student's needs data.
        logger.warning("Assess failed")
        yield sse("error", {"message": "Hermes didn't answer. Try again."})
        return

    # Treat a missing question or options as done, so the client never gets a question it can't show.
    if result.done or not result.question.strip() or not result.options:
        result = FINISHED
    yield sse("done", result.model_dump())


# Streams the next question to ask the student, or done once the assessment is complete.
@router.post("/assess")
async def assess(request: AssessRequest) -> StreamingResponse:
    return StreamingResponse(assess_events(request), media_type="text/event-stream", headers={"Cache-Control": "no-cache"})
