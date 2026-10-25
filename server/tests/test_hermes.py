import asyncio
from types import SimpleNamespace

import pytest
from pydantic import BaseModel

from app import hermes


def fake_client(monkeypatch, content, finish_reason="stop"):
    calls = []

    async def create(**kwargs):
        calls.append(kwargs)
        message = SimpleNamespace(content=content)
        return SimpleNamespace(choices=[SimpleNamespace(message=message, finish_reason=finish_reason)])

    client = SimpleNamespace(chat=SimpleNamespace(completions=SimpleNamespace(create=create)))
    monkeypatch.setattr(hermes, "get_client", lambda: client)
    return calls


def test_ask_hermes_sends_only_the_new_message_with_session(monkeypatch):
    calls = fake_client(monkeypatch, "API_OK")

    reply = asyncio.run(hermes.ask_hermes("Reply with exactly: API_OK", session_id="lip-test-1"))

    assert reply == "API_OK"
    assert calls[0]["model"] == "hermes-agent"
    assert calls[0]["messages"] == [{"role": "user", "content": "Reply with exactly: API_OK"}]
    assert calls[0]["extra_headers"]["X-Hermes-Session-Id"] == "lip-test-1"


def test_ask_hermes_sends_instructions_as_system_message(monkeypatch):
    calls = fake_client(monkeypatch, "Hi")

    asyncio.run(hermes.ask_hermes("Hello", instructions="Be brief."))

    assert calls[0]["messages"] == [
        {"role": "system", "content": "Be brief."},
        {"role": "user", "content": "Hello"},
    ]


def test_ask_hermes_sends_a_new_idempotency_key_per_call(monkeypatch):
    calls = fake_client(monkeypatch, "Hi")

    asyncio.run(hermes.ask_hermes("Hello"))
    asyncio.run(hermes.ask_hermes("Hello"))

    keys = [call["extra_headers"]["Idempotency-Key"] for call in calls]
    assert all(keys) and keys[0] != keys[1]


def test_ask_hermes_sends_no_session_header_without_session(monkeypatch):
    calls = fake_client(monkeypatch, "Hi")

    asyncio.run(hermes.ask_hermes("Hello"))

    assert "X-Hermes-Session-Id" not in calls[0]["extra_headers"]


def test_ask_hermes_returns_partial_answer_when_out_of_steps(monkeypatch):
    fake_client(monkeypatch, "Partial answer", finish_reason="length")

    assert asyncio.run(hermes.ask_hermes("Hello")) == "Partial answer"


@pytest.mark.parametrize("finish_reason", ["error", "cancelled"])
def test_ask_hermes_raises_on_failed_turn(monkeypatch, finish_reason):
    fake_client(monkeypatch, "Tool crashed", finish_reason=finish_reason)

    with pytest.raises(hermes.HermesError, match=f"Hermes turn {finish_reason}: Tool crashed"):
        asyncio.run(hermes.ask_hermes("Hello"))


class Pick(BaseModel):
    option: str


def fake_stream_client(monkeypatch, chunks):
    calls = []

    async def create(**kwargs):
        calls.append(kwargs)

        async def stream():
            for chunk in chunks:
                yield chunk

        return stream()

    client = SimpleNamespace(chat=SimpleNamespace(completions=SimpleNamespace(create=create)))
    monkeypatch.setattr(hermes, "get_client", lambda: client)
    return calls


def chunk(content=None, reasoning=None, finish_reason=None):
    delta = SimpleNamespace(content=content, reasoning_content=reasoning)
    return SimpleNamespace(choices=[SimpleNamespace(delta=delta, finish_reason=finish_reason)])


async def collect(stream):
    return [piece async for piece in stream]


def test_stream_hermes_yields_reasoning_and_text(monkeypatch):
    calls = fake_stream_client(
        monkeypatch,
        [
            chunk(reasoning="Hmm"),
            SimpleNamespace(choices=[]),
            SimpleNamespace(tool="web_search", emoji="🔍", label="ADHD learning", status="running"),
            SimpleNamespace(tool="web_search", emoji="🔍", label="ADHD learning", status="completed"),
            chunk(content="<!doctype"),
            chunk(finish_reason="stop"),
        ],
    )

    pieces = asyncio.run(collect(hermes.stream_hermes("Build", session_id="lip-test-1")))

    assert pieces == [("reasoning", "Hmm"), ("tool", "Suche im Web…"), ("text", "<!doctype")]
    assert calls[0]["stream"] is True
    assert calls[0]["extra_headers"] == {"X-Hermes-Session-Id": "lip-test-1"}


def test_stream_hermes_raises_on_failed_turn(monkeypatch):
    fake_stream_client(monkeypatch, [chunk(content="Partial"), chunk(finish_reason="error")])

    with pytest.raises(hermes.HermesError, match="Hermes turn error"):
        asyncio.run(collect(hermes.stream_hermes("Build")))


def fake_stream_replies(monkeypatch, replies):
    calls = []

    async def stream_hermes(message, session_id=None, instructions=None):
        calls.append((message, session_id, instructions))
        yield "reasoning", "Hmm"
        yield "text", replies[len(calls) - 1]

    monkeypatch.setattr(hermes, "stream_hermes", stream_hermes)
    return calls


def test_stream_hermes_json_counts_tokens_and_returns_parsed_reply(monkeypatch):
    calls = fake_stream_replies(monkeypatch, ['{"option": "A"}'])

    events = asyncio.run(collect(hermes.stream_hermes_json("Pick one", Pick, "lip-test-1", instructions="Be kind.")))

    assert events == [("reasoning", "Hmm"), ("tokens", 1), ("tokens", 2), ("result", Pick(option="A"))]
    message, session_id, instructions = calls[0]
    assert message == "Pick one"
    assert session_id == "lip-test-1"
    assert instructions.startswith("Be kind.")
    assert '"option"' in instructions


def test_stream_hermes_json_retries_once_in_same_session(monkeypatch):
    calls = fake_stream_replies(monkeypatch, ['```json\n{"option": "A"}\n```', '{"option": "A"}'])

    events = asyncio.run(collect(hermes.stream_hermes_json("Pick one", Pick, "lip-test-1")))

    assert events[-1] == ("result", Pick(option="A"))
    assert events[-2] == ("tokens", 4)
    assert calls[1][0].startswith("That reply was not valid")
    assert calls[1][1] == "lip-test-1"


def test_stream_hermes_json_raises_after_second_invalid_reply(monkeypatch):
    fake_stream_replies(monkeypatch, ["I think A", '{"wrong": 1}'])

    with pytest.raises(hermes.HermesError, match="valid JSON"):
        asyncio.run(collect(hermes.stream_hermes_json("Pick one", Pick, "lip-test-1")))



def test_ask_hermes_sends_model_and_provider_when_set(monkeypatch):
    calls = fake_client(monkeypatch, "ok")

    asyncio.run(hermes.ask_hermes("Hi", model="m", provider="bedrock"))

    assert calls[0]["model"] == "m"
    assert calls[0]["extra_body"] == {"provider": "bedrock"}


def test_ask_hermes_without_model_keeps_the_default(monkeypatch):
    calls = fake_client(monkeypatch, "ok")

    asyncio.run(hermes.ask_hermes("Hi"))

    assert calls[0]["model"] == "hermes-agent"
    assert "extra_body" not in calls[0]
def test_every_browser_tool_gets_the_browser_status():
    assert hermes.tool_status("browser_navigate") == hermes.BROWSER_STATUS
    assert hermes.tool_status("browser_click") == hermes.BROWSER_STATUS
    assert hermes.tool_status("terminal") == "Führe Code aus…"
    assert hermes.tool_status("something_new") == "Arbeitet…"
