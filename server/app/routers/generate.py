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
from pydantic import BaseModel, Field, ValidationError

from app import hermes, learner, themes
from app.routers.assess import Answer
from app.routers.solution import CATALOG, REQUIRED_PROPS, Element, LessonSpec
from app.sse import TextBatch, sse

router = APIRouter(tags=["generate"])

# Uvicorn's logger, so generation failures show up in the server terminal.
logger = logging.getLogger("uvicorn.error")

# Rules for the lesson Hermes streams, with the catalog filled in; {{THEME}} is filled per request.
PROMPT = (
    (Path(__file__).parent.parent / "prompts" / "generate_page.txt")
    .read_text(encoding="utf-8")
    .replace("{{CATALOG}}", json.dumps(CATALOG["components"], ensure_ascii=False))
)

# Below Vercel's 300 s function limit, so the student gets our German error instead of a cut stream.
GENERATE_TIMEOUT_SECONDS = 270

PLAN_STATUS = f"{hermes.TUTOR_NAME} plant deine Seite…"
FAILED = "Deine Seite konnte nicht gebaut werden. Versuch es nochmal."

# Hermes sees its own reply in the session, so this is enough to ask again.
RETRY_MESSAGE = (
    "That reply had no valid line. Reply again with only the JSON Patch lines from your instructions, "
    "one JSON object per line, starting with the root."
)

ELEMENT_PATH = re.compile(r"/elements/([A-Za-z0-9_-]{1,64})")


class GenerateRequest(BaseModel):
    profile: dict[str, Any] = Field(description="Student profile from the intake form.")
    answers: list[Answer] = Field(description="Answers from the assessment questions.")
    material: str = Field(min_length=1, description="The learning material, or the topic to learn.")
    theme: themes.ThemeName = Field(
        default=themes.DEFAULT_THEME, description="The theme to build, usually the assessment's top pick."
    )
    student_id: learner.StudentId | None = None


# The student's data goes into the user message, fenced, so nothing in it reads as our rules.
# "<" is escaped (still valid JSON) so the student's text can't close the fence.
def data_message(request: GenerateRequest) -> str:
    data = {
        "profile": request.profile,
        "answers": [answer.model_dump() for answer in request.answers],
        "material": request.material,
    }
    fenced = json.dumps(data, ensure_ascii=False, indent=2).replace("<", "\\u003c")
    notes = learner.notes_block(request.student_id)
    return f"Build the lesson for this student.\n\n<student_data>\n{fenced}\n</student_data>" + (
        f"\n\n{notes}" if notes else ""
    )


def lesson_key(spec: dict[str, Any]) -> str | None:
    return next((key for key, element in spec["elements"].items() if element["type"] == "Lesson"), None)


# Checks one line of Hermes's reply against the catalog. Returns the patches to forward and the spec after them,
# or raises ValueError with a short reason (never the line, which can repeat the student's data).
def accept_line(line: str, spec: dict[str, Any]) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    try:
        patch = json.loads(line)
    except json.JSONDecodeError:
        raise ValueError("not JSON") from None
    if not isinstance(patch, dict) or patch.get("op") not in ("add", "replace"):
        raise ValueError("not an add operation")
    path, value = patch.get("path"), patch.get("value")
    if path == "/root":
        if not isinstance(value, str) or not ELEMENT_PATH.fullmatch(f"/elements/{value}"):
            raise ValueError("root is not an element key")
        return [{"op": "add", "path": path, "value": value}], {**spec, "root": value}
    match = ELEMENT_PATH.fullmatch(path) if isinstance(path, str) else None
    if not match:
        raise ValueError("unsupported path")
    key = match.group(1)
    try:
        element = Element.model_validate(value).model_dump()
    except ValidationError:
        raise ValueError(f"{key}: not an element") from None
    if element["type"] not in REQUIRED_PROPS:
        raise ValueError(f'{key}: unknown type "{element["type"]}"')
    if missing := [prop for prop in REQUIRED_PROPS[element["type"]] if prop not in element["props"]]:
        raise ValueError(f"{key}: {element['type']} is missing {', '.join(missing)}")
    lesson = lesson_key(spec)
    if element["type"] == "Lesson" and lesson not in (None, key):
        raise ValueError(f"{key}: a second Lesson")
    patches = [{"op": "add", "path": path, "value": element}]
    spec = {**spec, "elements": {**spec["elements"], key: element}}
    # A block left out of the outline would never render, so it goes to the end of the Lesson.
    if lesson and element["type"] != "Lesson" and key not in spec["elements"][lesson]["children"]:
        outline = {**spec["elements"][lesson], "children": [*spec["elements"][lesson]["children"], key]}
        patches.append({"op": "add", "path": f"/elements/{lesson}", "value": outline})
        spec = {**spec, "elements": {**spec["elements"], lesson: outline}}
    return patches, spec


# The assembled spec, without outline keys that never arrived (skipped or not written), checked against the catalog.
def finished_spec(spec: dict[str, Any]) -> LessonSpec:
    elements = {
        key: {**element, "children": [child for child in element["children"] if child in spec["elements"]]}
        for key, element in spec["elements"].items()
    }
    finished = LessonSpec.model_validate({**spec, "elements": elements})
    if not finished.elements[finished.root].children:
        raise ValueError("the lesson has no blocks")
    return finished


def build_status(spec: dict[str, Any]) -> str:
    blocks = sum(element["type"] != "Lesson" for element in spec["elements"].values())
    if not blocks:
        return f"{hermes.TUTOR_NAME} schreibt deine Seite…"
    return f"{blocks} {'Teil' if blocks == 1 else 'Teile'} fertig, {hermes.TUTOR_NAME} schreibt weiter…"


# The lesson so far while Hermes streams it, with the last status sent.
class Build:
    def __init__(self) -> None:
        self.spec: dict[str, Any] = {"root": "", "elements": {}}
        self.accepted = 0
        self.status = PLAN_STATUS

    def status_events(self, status: str) -> list[str]:
        if status == self.status:
            return []
        self.status = status
        return [sse("status", {"text": status})]

    # Forwards one complete line as patch events; a broken line is logged and skipped, the stream goes on.
    def line_events(self, line: str) -> list[str]:
        if not line.strip():
            return []
        try:
            patches, self.spec = accept_line(line.strip(), self.spec)
        except ValueError as problem:
            logger.warning("Skipped a lesson line: %s", problem)
            return []
        self.accepted += len(patches)
        return [sse("patch", {"patch": patch}) for patch in patches] + self.status_events(build_status(self.spec))

    # Streams one Hermes turn: "reasoning" in chunks, "status" for tools and progress, "patch" per complete valid line.
    async def turn(self, message: str, session_id: str, instructions: str) -> AsyncIterator[str]:
        reasoning = TextBatch()
        pending = ""
        async for kind, piece in hermes.stream_hermes(message, session_id=session_id, instructions=instructions):
            if kind == "reasoning":
                if text := reasoning.add(piece):
                    yield sse("reasoning", {"text": text})
                continue
            if kind == "tool":
                events = self.status_events(piece)
            else:
                *lines, pending = (pending + piece).split("\n")
                events = [event for line in lines for event in self.line_events(line)]
            for event in events:
                yield event
        for event in self.line_events(pending):
            yield event
        if text := reasoning.flush():
            yield sse("reasoning", {"text": text})


# Runs one generation and yields server-sent events: "status", "reasoning" and one "patch" per block while Hermes
# writes, then "done" with the whole spec or "error".
async def generate_events(request: GenerateRequest) -> AsyncIterator[str]:
    started = time.monotonic()
    yield sse("status", {"text": PLAN_STATUS})
    build = Build()
    # A fresh session per generation, prefixed because the team shares one Hermes.
    session_id = f"lip-generate-{uuid.uuid4()}"
    message, instructions = data_message(request), PROMPT.replace("{{THEME}}", themes.THEMES[request.theme])
    try:
        async with asyncio.timeout(GENERATE_TIMEOUT_SECONDS):
            # One retry, only when nothing usable arrived: a half-built lesson is already on the student's screen.
            for _ in range(2):
                async for event in build.turn(message, session_id, instructions):
                    yield event
                if build.accepted:
                    break
                message = RETRY_MESSAGE
    except TimeoutError:
        logger.warning("Generation timed out after %.0fs", time.monotonic() - started)
        yield sse("error", {"message": "Das hat zu lange gedauert. Versuch es gleich nochmal."})
        return
    except (hermes.HermesError, OpenAIError):
        logger.exception("Generation failed after %.0fs", time.monotonic() - started)
        yield sse("error", {"message": f"{hermes.TUTOR_NAME} antwortet gerade nicht. Versuch es nochmal."})
        return

    try:
        spec = finished_spec(build.spec)
    except ValueError as problem:
        # ValidationError's text can quote the student's data, so only its count goes to the log.
        reason = f"{problem.error_count()} catalog problems" if isinstance(problem, ValidationError) else problem
        logger.warning("Generation gave no usable lesson after %.0fs: %s", time.monotonic() - started, reason)
        yield sse("error", {"message": FAILED})
        return
    logger.info("Generation done in %.0fs, %d blocks", time.monotonic() - started, len(spec.elements) - 1)
    yield sse("done", {"spec": spec.model_dump()})


# Asks Hermes to build a lesson in the chosen theme for the student, streaming each block as it is written.
@router.post("/generate")
async def generate(request: GenerateRequest) -> StreamingResponse:
    return StreamingResponse(generate_events(request), media_type="text/event-stream", headers={"Cache-Control": "no-cache"})
