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
from app.routers.assess import Answer
from app.sse import TextBatch, sse

router = APIRouter(tags=["generate"])

# Uvicorn's logger, so generation failures show up in the server terminal.
logger = logging.getLogger("uvicorn.error")

# Rules for the page Hermes writes; the {{...}} placeholders are filled with the student's data.
PROMPT = (Path(__file__).parent.parent / "prompts" / "generate_page.txt").read_text(encoding="utf-8")

# Rules for the second session, which tests the written page in a browser and fixes what's broken.
VERIFY_PROMPT = (Path(__file__).parent.parent / "prompts" / "verify_page.txt").read_text(encoding="utf-8")

# Upper limit for a whole generation, even if Hermes keeps sending keepalives.
GENERATE_TIMEOUT_SECONDS = 900

# Whether a second Hermes session tests each page in a browser and fixes it. Off because it adds about 3 to 10 minutes.
# TODO: set to True to test pages again, and raise the client's /generate timeout in client/src/api/generate.ts
# to cover both sessions (writing up to 15 min plus testing up to 10 min).
VERIFY_PAGES = False

# Upper limit for testing and fixing the page; past it the student gets the untested page.
VERIFY_TIMEOUT_SECONDS = 600

PLAN_STATUS = "Hermes plant deine Seite…"
VERIFY_STATUS = "Hermes testet deine Seite…"

# Blocks the generated page from loading or sending anything over the network, so it can't leak data.
CSP = (
    '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; '
    "script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; "
    "font-src data:; media-src data: blob:; base-uri 'none'; form-action 'none'\">"
)

DOCTYPE = re.compile(r"<!doctype html[^>]*>", re.IGNORECASE)

# How much new page text Hermes writes between two live previews, so the student sees the page grow without the
# preview reloading on every token.
PREVIEW_STEP = 1500


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


# Fills the test prompt with the theme's design and the written page. The page goes in last, so text inside it
# can never be taken for a placeholder.
def fill_verify_prompt(theme: str, html: str, file_name: str) -> str:
    return (
        VERIFY_PROMPT.replace("{{THEME}}", themes.THEMES[theme])
        .replace("{{FILE}}", file_name)
        .replace("{{PAGE}}", html)
    )


# Pulls the HTML document out of the reply and puts our CSP first, so it applies before any generated script runs.
def prepare_page(reply: str) -> str | None:
    start = DOCTYPE.search(reply)
    end = reply.lower().rfind("</html>")
    if not start or end < start.end():
        return None
    # The CSP goes right after the doctype; anything before the doctype would switch the page to quirks mode.
    return start.group() + CSP + reply[start.end() : end + len("</html>")]


# The half-written page as a renderable document: cut at the last complete tag, closed, and with our CSP first.
def preview_page(reply: str) -> str | None:
    return prepare_page(reply[: reply.rfind(">") + 1] + "</body></html>")


# Turns the reply so far into a short status line for the student.
# Before the page starts, show the last line Hermes wrote; once the page starts, show how much is written.
def progress_text(reply: str) -> str:
    start = DOCTYPE.search(reply)
    if start:
        return f"Die Seite wird geschrieben… {(len(reply) - start.start()) // 1000} KB"
    lines = [line.strip() for line in reply.splitlines() if line.strip()]
    return lines[-1][:200] if lines else "Denkt nach…"


# One Hermes turn's reply so far, and whether Hermes used a browser during it.
class Turn:
    def __init__(self) -> None:
        self.reply = ""
        self.used_browser = False


# Streams one Hermes turn as "status" (the current step), "reasoning" (Hermes thinking, in chunks) and "preview" (the
# page so far, every PREVIEW_STEP characters once it starts) events, collecting the reply in `turn`.
async def stream_turn(prompt: str, session_id: str, turn: Turn, status: str) -> AsyncIterator[str]:
    reasoning = TextBatch()
    previewed = 0
    async for kind, piece in hermes.stream_hermes(prompt, session_id=session_id):
        if kind == "reasoning":
            if text := reasoning.add(piece):
                yield sse("reasoning", {"text": text})
            continue
        if kind == "tool":
            turn.used_browser |= piece == hermes.BROWSER_STATUS
            new_status = piece
        else:
            turn.reply += piece
            new_status = progress_text(turn.reply)
            start = DOCTYPE.search(turn.reply)
            if start and len(turn.reply) - start.start() >= previewed + PREVIEW_STEP:
                previewed = len(turn.reply) - start.start()
                yield sse("preview", {"html": preview_page(turn.reply)})
        if new_status != status:
            status = new_status
            yield sse("status", {"text": status})
    if text := reasoning.flush():
        yield sse("reasoning", {"text": text})


# Runs one generation and yields server-sent events: "status" and "reasoning" while Hermes writes the page (and tests
# it, when VERIFY_PAGES is on), then "done" with the page or "error".
async def generate_events(request: GenerateRequest) -> AsyncIterator[str]:
    started = time.monotonic()
    yield sse("status", {"text": PLAN_STATUS})
    written = Turn()
    try:
        async with asyncio.timeout(GENERATE_TIMEOUT_SECONDS):
            # A fresh session per generation, prefixed because the team shares one Hermes.
            async for event in stream_turn(fill_prompt(request), f"lip-generate-{uuid.uuid4()}", written, PLAN_STATUS):
                yield event
    except TimeoutError:
        logger.warning("Generation timed out after %.0fs", time.monotonic() - started)
        yield sse("error", {"message": "Das hat zu lange gedauert. Versuch es gleich nochmal."})
        return
    except (hermes.HermesError, OpenAIError):
        logger.exception("Generation failed after %.0fs", time.monotonic() - started)
        yield sse("error", {"message": "Hermes antwortet gerade nicht. Versuch es nochmal."})
        return

    html = prepare_page(written.reply)
    if html is None:
        # Logs only the size, because the reply can repeat the student's needs data.
        logger.warning("Generation returned no page (%d characters)", len(written.reply))
        yield sse("error", {"message": "Hermes hat keine Seite geliefert. Versuch es nochmal."})
        return
    logger.info("Generation done in %.0fs, %d KB", time.monotonic() - started, len(html) // 1000)
    # TODO: testing is disconnected here until VERIFY_PAGES is turned back on.
    if not VERIFY_PAGES:
        yield sse("done", {"html": html})
        return

    # Any problem while testing keeps the written page, because an untested page beats no page.
    started = time.monotonic()
    yield sse("status", {"text": VERIFY_STATUS})
    checked = Turn()
    # The same ID names the session and the page file, so teammates' runs on the shared Hermes never collide.
    verify_id = f"lip-verify-{uuid.uuid4()}"
    try:
        async with asyncio.timeout(VERIFY_TIMEOUT_SECONDS):
            async for event in stream_turn(
                fill_verify_prompt(request.theme, html, verify_id), verify_id, checked, VERIFY_STATUS
            ):
                yield event
    except TimeoutError:
        logger.warning("Testing timed out after %.0fs; sending the untested page", time.monotonic() - started)
    except (hermes.HermesError, OpenAIError):
        logger.exception("Testing failed after %.0fs; sending the untested page", time.monotonic() - started)
    else:
        # The tested page still carries our CSP; it's removed so prepare_page adds exactly one.
        tested = prepare_page(checked.reply.replace(CSP, ""))
        if not checked.used_browser:
            logger.warning("Testing never opened a browser; sending the untested page")
        elif tested is None:
            logger.warning("Testing returned no page (%d characters); sending the untested page", len(checked.reply))
        else:
            html = tested
            logger.info("Testing done in %.0fs, %d KB", time.monotonic() - started, len(html) // 1000)
    yield sse("done", {"html": html})


# Asks Hermes to write a learning page in the chosen theme for the student, streaming progress while it works.
@router.post("/generate")
async def generate(request: GenerateRequest) -> StreamingResponse:
    return StreamingResponse(generate_events(request), media_type="text/event-stream", headers={"Cache-Control": "no-cache"})
