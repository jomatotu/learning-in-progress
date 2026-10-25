import json
import uuid
from collections.abc import AsyncIterator
from functools import cache
from typing import Any, Literal

import httpx
from openai import AsyncOpenAI
from pydantic import BaseModel

from app.settings import get_settings

# Hermes always serves its configured model under this name; the real LLM is set on the VPS.
MODEL = "hermes-agent"

# An agent turn can run tools for several minutes.
TIMEOUT_SECONDS = 600

# Plain one-line status per Hermes tool, so the student never sees raw tool names or commands.
TOOL_STATUS = {
    "web_search": "Suche im Web…",
    "web_extract": "Lese eine Webseite…",
    "terminal": "Führe Code aus…",
    "execute_code": "Führe Code aus…",
    "read_file": "Lese Dateien…",
    "search_files": "Lese Dateien…",
    "write_file": "Schreibe Dateien…",
    "patch": "Schreibe Dateien…",
    "skill_view": "Schaue in seine Notizen…",
    "skills_list": "Schaue in seine Notizen…",
    "memory": "Schaue in sein Gedächtnis…",
}

# Status for every browser tool (browser_navigate, browser_click, …), so callers can tell Hermes opened a page.
BROWSER_STATUS = "Teste die Seite im Browser…"


def tool_status(tool: str) -> str:
    return BROWSER_STATUS if tool.startswith("browser") else TOOL_STATUS.get(tool, "Arbeitet…")


class HermesError(Exception):
    pass


# Shares one Hermes client across requests. Created on first use so the server still starts without the env vars.
@cache
def get_client() -> AsyncOpenAI:
    settings = get_settings()
    if not settings.hermes_base_url or not settings.hermes_api_key:
        raise HermesError("HERMES_BASE_URL and HERMES_API_KEY must be set in server/.env")
    return AsyncOpenAI(
        base_url=settings.hermes_base_url,
        api_key=settings.hermes_api_key.get_secret_value(),
        timeout=TIMEOUT_SECONDS,
    )


# Builds the chat messages: our rules as a system message, which Hermes layers on top of its own system prompt, then the new user message.
def chat_messages(message: str, instructions: str | None) -> list[dict[str, str]]:
    system = [{"role": "system", "content": instructions}] if instructions else []
    return [*system, {"role": "user", "content": message}]


# Sends one message to the Hermes agent and returns its reply.
# Hermes keeps the history per session_id, so send only the new message. Prefix IDs (e.g. "lip-peter-1") because the team shares one Hermes.
# Without a session_id Hermes derives one from the messages, so identical requests would share a history.
# `model` is only honoured by the gateway together with an explicit `provider`; unset keeps the Hermes default.
async def ask_hermes(
    message: str,
    session_id: str | None = None,
    instructions: str | None = None,
    model: str | None = None,
    provider: str | None = None,
) -> str:
    headers = {"X-Hermes-Session-Id": session_id} if session_id else {}
    # The SDK retries failed requests with the same headers, so this key stops Hermes from running the turn twice.
    headers["Idempotency-Key"] = str(uuid.uuid4())
    extra = {"extra_body": {"provider": provider}} if provider else {}
    response = await get_client().chat.completions.create(
        model=model or MODEL,
        messages=chat_messages(message, instructions),
        extra_headers=headers,
        **extra,
    )
    choice = response.choices[0]
    if choice.finish_reason in ("error", "cancelled"):
        raise HermesError(f"Hermes turn {choice.finish_reason}: {choice.message.content}")
    # "length" means Hermes ran out of steps; the partial answer is still usable.
    return choice.message.content or ""


# Hermes sends a keepalive every 10 seconds while it works, so this long a silence means it has stopped.
STALL_SECONDS = 120


# Streams one Hermes turn as (kind, piece) pairs, so callers can show progress while the agent works.
# Kinds: "reasoning" (the model thinking), "tool" (a tool Hermes started, as a plain status line), and "text" (the reply).
async def stream_hermes(
    message: str, session_id: str | None = None, instructions: str | None = None
) -> AsyncIterator[tuple[Literal["reasoning", "tool", "text"], str]]:
    headers = {"X-Hermes-Session-Id": session_id} if session_id else {}
    stream = await get_client().chat.completions.create(
        model=MODEL,
        messages=chat_messages(message, instructions),
        extra_headers=headers,
        stream=True,
        timeout=httpx.Timeout(TIMEOUT_SECONDS, read=STALL_SECONDS),
    )
    async for chunk in stream:
        # Hermes's own hermes.tool.progress events arrive without choices, with the tool fields on the chunk.
        choices = getattr(chunk, "choices", None)
        if not choices:
            tool = getattr(chunk, "tool", None)
            if tool and getattr(chunk, "status", None) == "running":
                yield "tool", tool_status(tool)
            continue
        choice = choices[0]
        # Reasoning isn't part of the OpenAI schema; Hermes sends it as an extra field on some models.
        reasoning = getattr(choice.delta, "reasoning_content", None) or getattr(choice.delta, "reasoning", None)
        if reasoning:
            yield "reasoning", reasoning
        if choice.delta.content:
            yield "text", choice.delta.content
        if choice.finish_reason in ("error", "cancelled"):
            raise HermesError(f"Hermes turn {choice.finish_reason}")


# Streams one Hermes turn that must end in JSON matching `schema`. While Hermes works it yields ("tokens", count so far)
# plus the "reasoning" and "tool" pieces from stream_hermes; at the end it yields ("result", parsed reply).
# Hermes ignores response_format, so the schema goes into the instructions and the reply is checked here.
# In tests against our Hermes (DeepSeek) the replies were plain JSON; the retry covers the rare bad one.
async def stream_hermes_json[T: BaseModel](
    message: str, schema: type[T], session_id: str, instructions: str | None = None
) -> AsyncIterator[tuple[Literal["tokens", "reasoning", "tool", "result"], Any]]:
    json_rule = (
        "Reply with only one JSON object that matches this JSON schema. "
        "No text before or after it, and no markdown code fences.\n"
        + json.dumps(schema.model_json_schema())
    )
    instructions = f"{instructions}\n\n{json_rule}" if instructions else json_rule
    # Each streamed piece is about one token, close enough for a progress count.
    tokens = 0
    for _ in range(2):
        reply = ""
        async for kind, piece in stream_hermes(message, session_id, instructions):
            if kind == "tool":
                yield "tool", piece
                continue
            tokens += 1
            if kind == "text":
                reply += piece
            else:
                yield "reasoning", piece
            yield "tokens", tokens
        try:
            result = schema.model_validate_json(reply)
        except ValueError as error:
            # Retry once in the same session, so Hermes sees its own reply and what was wrong with it.
            message = f"That reply was not valid: {error}\n\n{json_rule}"
            continue
        yield "result", result
        return
    raise HermesError("Hermes did not return valid JSON")
