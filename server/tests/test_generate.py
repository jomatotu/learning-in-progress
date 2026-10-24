import json

import httpx
from fastapi.testclient import TestClient
from openai import APIConnectionError

from app import hermes
from app.main import app
from app import themes
from app.routers import generate

client = TestClient(app)

PAGE = "<!DOCTYPE html><html><body><h1>Osmose</h1></body></html>"
REQUEST = {
    "profile": {"name": "Peter", "challenges": ["ADHD"], "interests": ["Minecraft"]},
    "answers": [{"question": "Reading or doing?", "answer": "Doing"}],
    "material": "Osmose ist die Diffusion von Wasser durch eine Membran.",
}


def fake_stream(monkeypatch, pieces, error=None):
    calls = []

    async def stream_hermes(message, session_id=None):
        calls.append({"message": message, "session_id": session_id})
        for piece in pieces:
            yield piece
        if error:
            raise error

    monkeypatch.setattr(generate.hermes, "stream_hermes", stream_hermes)
    return calls


# Posts a generation and returns its server-sent events as (event, data) pairs.
def events():
    response = client.post("/api/generate", json=REQUEST)
    assert response.headers["content-type"].startswith("text/event-stream")
    parsed = []
    for block in response.text.strip().split("\n\n"):
        event, data = block.split("\n")
        parsed.append((event.removeprefix("event: "), json.loads(data.removeprefix("data: "))))
    return parsed


def test_generate_streams_progress_then_page_with_csp(monkeypatch):
    fake_stream(
        monkeypatch,
        [("reasoning", "x" * 250), ("tool", "Searching the web…"), ("text", PAGE)],
    )

    assert events() == [
        ("status", {"text": "Hermes is planning your page…"}),
        ("reasoning", {"text": "x" * 250}),
        ("status", {"text": "Searching the web…"}),
        ("status", {"text": "Writing the page… 0 KB"}),
        ("done", {"html": "<!DOCTYPE html>" + generate.CSP + "<html><body><h1>Osmose</h1></body></html>"}),
    ]


def test_generate_sends_status_only_when_it_changes(monkeypatch):
    fake_stream(monkeypatch, [("tool", "Searching the web…"), ("reasoning", "a"), ("tool", "Searching the web…"), ("text", PAGE)])

    statuses = [data["text"] for event, data in events() if event == "status"]

    assert statuses.count("Searching the web…") == 1


def test_generate_puts_profile_answers_and_material_into_prompt(monkeypatch):
    calls = fake_stream(monkeypatch, [("text", PAGE)])

    events()

    prompt = calls[0]["message"]
    assert '"challenges": [\n    "ADHD"\n  ]' in prompt
    assert '"answer": "Doing"' in prompt
    assert "<material>\nOsmose ist die Diffusion von Wasser durch eine Membran.\n</material>" in prompt
    assert "{{" not in prompt


def test_generate_uses_chunked_theme_by_default(monkeypatch):
    calls = fake_stream(monkeypatch, [("text", PAGE)])

    events()

    assert themes.THEMES["chunked"] in calls[0]["message"]


def test_generate_puts_requested_theme_into_prompt(monkeypatch):
    calls = fake_stream(monkeypatch, [("text", PAGE)])

    client.post("/api/generate", json={**REQUEST, "theme": "read-aloud"})

    prompt = calls[0]["message"]
    assert themes.THEMES["read-aloud"] in prompt
    assert themes.THEMES["chunked"] not in prompt


def test_generate_rejects_unknown_theme():
    response = client.post("/api/generate", json={**REQUEST, "theme": "study-songs"})

    assert response.status_code == 422


def test_generate_starts_a_new_prefixed_session_each_time(monkeypatch):
    calls = fake_stream(monkeypatch, [("text", PAGE)])

    events()
    events()

    assert calls[0]["session_id"].startswith("lip-generate-")
    assert calls[0]["session_id"] != calls[1]["session_id"]


def test_generate_strips_text_and_fences_around_page(monkeypatch):
    fake_stream(monkeypatch, [("text", f"Here is your page:\n```html\n{PAGE}\n```\nEnjoy!")])

    event, data = events()[-1]

    assert event == "done"
    assert data["html"].startswith("<!DOCTYPE html>")
    assert data["html"].endswith("</html>")


def test_generate_reports_reply_without_page(monkeypatch):
    fake_stream(monkeypatch, [("text", "Sorry, I hit a rate limit.")])

    assert events()[-1] == ("error", {"message": "Hermes did not return a page. Try again."})


def test_generate_reports_hermes_failure(monkeypatch):
    fake_stream(
        monkeypatch,
        [("text", "Working")],
        error=APIConnectionError(request=httpx.Request("POST", "http://hermes")),
    )

    assert events()[-1] == ("error", {"message": "Hermes stopped responding. Try again."})


def test_generate_reports_failed_hermes_turn(monkeypatch):
    fake_stream(monkeypatch, [], error=hermes.HermesError("Hermes turn error"))

    assert events()[-1] == ("error", {"message": "Hermes stopped responding. Try again."})


def test_generate_rejects_empty_material():
    response = client.post("/api/generate", json={**REQUEST, "material": ""})

    assert response.status_code == 422
