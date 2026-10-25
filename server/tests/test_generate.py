import json

import httpx
from fastapi.testclient import TestClient
from openai import APIConnectionError

from app import hermes, themes
from app.main import app
from app.routers import generate

client = TestClient(app)

PAGE = "<!DOCTYPE html><html><body><h1>Osmose</h1></body></html>"
WITH_CSP = "<!DOCTYPE html>" + generate.CSP + "<html><body><h1>Osmose</h1></body></html>"
FIXED = "<!DOCTYPE html>" + generate.CSP + "<html><body><h1>Osmose</h1><button>Next</button></body></html>"
REQUEST = {
    "profile": {"name": "Peter", "challenges": ["ADHD"], "interests": ["Minecraft"]},
    "answers": [{"question": "Reading or doing?", "answer": "Doing"}],
    "material": "Osmose ist die Diffusion von Wasser durch eine Membran.",
}


# Fakes both Hermes sessions of a generation: the first writes the page, the second tests it.
def fake_stream(monkeypatch, pieces, error=None, verify=(), verify_error=None):
    calls = []

    async def stream_hermes(message, session_id=None):
        writing = session_id.startswith("lip-generate-")
        calls.append({"message": message, "session_id": session_id})
        for piece in pieces if writing else verify:
            yield piece
        if error if writing else verify_error:
            raise error if writing else verify_error

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
        [("reasoning", "x" * 250), ("tool", "Suche im Web…"), ("text", PAGE)],
    )

    assert events() == [
        ("status", {"text": generate.PLAN_STATUS}),
        ("reasoning", {"text": "x" * 250}),
        ("status", {"text": "Suche im Web…"}),
        ("status", {"text": "Die Seite wird geschrieben… 0 KB"}),
        ("done", {"html": WITH_CSP}),
    ]


def test_generate_streams_throttled_previews_with_csp_once_the_page_starts(monkeypatch):
    plan = "Ich plane die Seite.\n" * 200
    page = "<!DOCTYPE html><html><body>" + "<p>Wasser wandert.</p>" * 300 + "</body></html>"
    reply = plan + page
    fake_stream(monkeypatch, [("text", reply[i : i + 100]) for i in range(0, len(reply), 100)])

    sent = events()

    previews = [data["html"] for event, data in sent if event == "preview"]
    assert 1 < len(previews) <= len(page) // generate.PREVIEW_STEP + 1
    for html in previews:
        assert html.startswith("<!DOCTYPE html>" + generate.CSP + "<html><body><p>")
        assert html.endswith("></body></html>")
    first_preview = next(i for i, (event, _) in enumerate(sent) if event == "preview")
    page_started = next(i for i, (_, data) in enumerate(sent) if "geschrieben" in data.get("text", ""))
    assert page_started < first_preview
    assert sent[-1] == ("done", {"html": generate.prepare_page(reply)})


def test_generate_sends_status_only_when_it_changes(monkeypatch):
    fake_stream(monkeypatch, [("tool", "Suche im Web…"), ("reasoning", "a"), ("tool", "Suche im Web…"), ("text", PAGE)])

    statuses = [data["text"] for event, data in events() if event == "status"]

    assert statuses.count("Suche im Web…") == 1


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

    assert events()[-1] == ("error", {"message": "Morph hat keine Seite geliefert. Versuch es nochmal."})


def test_generate_reports_hermes_failure(monkeypatch):
    fake_stream(
        monkeypatch,
        [("text", "Working")],
        error=APIConnectionError(request=httpx.Request("POST", "http://hermes")),
    )

    assert events()[-1] == ("error", {"message": "Morph antwortet gerade nicht. Versuch es nochmal."})


def test_generate_reports_failed_hermes_turn(monkeypatch):
    fake_stream(monkeypatch, [], error=hermes.HermesError("Hermes turn error"))

    assert events()[-1] == ("error", {"message": "Morph antwortet gerade nicht. Versuch es nochmal."})


def test_generate_rejects_empty_material():
    response = client.post("/api/generate", json={**REQUEST, "material": ""})

    assert response.status_code == 422


def test_page_csp_forbids_base_and_forms():
    page = generate.prepare_page("<!doctype html><html><head></head><body></body></html>")

    csp_tag = page[page.index('<meta http-equiv="Content-Security-Policy"') :].split(">", 1)[0]
    assert "base-uri 'none'" in csp_tag
    assert "form-action 'none'" in csp_tag
def test_generate_sends_the_tested_page_when_hermes_used_a_browser(monkeypatch):
    monkeypatch.setattr(generate, "VERIFY_PAGES", True)
    fake_stream(
        monkeypatch,
        [("text", PAGE)],
        verify=[("tool", hermes.BROWSER_STATUS), ("text", f"Fixed: added the Next button.\n{FIXED}")],
    )

    result = events()

    assert ("status", {"text": hermes.BROWSER_STATUS}) in result
    # One CSP only, although the tested page came back with ours already in it.
    assert result[-1] == ("done", {"html": FIXED})


def test_generate_gives_the_tester_the_theme_and_page_in_its_own_session(monkeypatch):
    monkeypatch.setattr(generate, "VERIFY_PAGES", True)
    calls = fake_stream(monkeypatch, [("text", PAGE)])

    client.post("/api/generate", json={**REQUEST, "theme": "memory-palace"})

    prompt, session_id = calls[1]["message"], calls[1]["session_id"]
    assert session_id.startswith("lip-verify-")
    assert themes.THEMES["memory-palace"] in prompt
    assert f"<page>\n{WITH_CSP}\n</page>" in prompt
    assert f"{session_id}.html" in prompt
    assert "{{" not in prompt


def test_generate_keeps_the_written_page_when_testing_used_no_browser(monkeypatch):
    monkeypatch.setattr(generate, "VERIFY_PAGES", True)
    fake_stream(monkeypatch, [("text", PAGE)], verify=[("text", FIXED)])

    assert events()[-1] == ("done", {"html": WITH_CSP})


def test_generate_keeps_the_written_page_when_testing_returns_no_page(monkeypatch):
    monkeypatch.setattr(generate, "VERIFY_PAGES", True)
    fake_stream(monkeypatch, [("text", PAGE)], verify=[("tool", hermes.BROWSER_STATUS), ("text", "Checked: all fine.")])

    assert events()[-1] == ("done", {"html": WITH_CSP})


def test_generate_keeps_the_written_page_when_testing_fails(monkeypatch):
    monkeypatch.setattr(generate, "VERIFY_PAGES", True)
    fake_stream(monkeypatch, [("text", PAGE)], verify_error=hermes.HermesError("Hermes turn error"))

    assert events()[-1] == ("done", {"html": WITH_CSP})


def test_generate_skips_testing_while_verify_pages_is_off(monkeypatch):
    calls = fake_stream(monkeypatch, [("text", PAGE)])

    assert events()[-1] == ("done", {"html": WITH_CSP})
    assert len(calls) == 1
