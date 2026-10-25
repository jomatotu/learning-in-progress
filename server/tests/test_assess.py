import json

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app import hermes, themes
from app.main import app
from app.routers import assess

client = TestClient(app)

PROFILE = {"name": "Peter", "needs": ["ADHD"]}
QUESTION = {
    "done": False,
    "question": "Do you prefer listening or reading?",
    "options": ["Listening", "Reading"],
    "themes": [],
}
PICKS = [
    {"theme": "read-aloud", "reason": "You said listening works best."},
    {"theme": "chunked", "reason": "Short steps help you focus."},
]
FINISHED = {"done": True, "question": "", "options": [], "themes": PICKS}
DEFAULT_FINISHED = {"done": True, "question": "", "options": [], "themes": [{"theme": "chunked", "reason": ""}]}


def fake_stream_json(monkeypatch, reply, tokens=0, error=None):
    calls = []

    async def stream_hermes_json(message, schema, session_id, instructions=None):
        calls.append({"message": message, "session_id": session_id, "instructions": instructions})
        for count in range(1, tokens + 1):
            yield "tokens", count
        if error:
            raise error
        yield "result", schema(**reply)

    monkeypatch.setattr(assess.hermes, "stream_hermes_json", stream_hermes_json)
    return calls


# Posts an assessment and returns its server-sent events as (event, data) pairs.
def events(answers=()):
    response = client.post("/api/assess", json={"profile": PROFILE, "answers": list(answers)})
    assert response.headers["content-type"].startswith("text/event-stream")
    parsed = []
    for block in response.text.strip().split("\n\n"):
        event, data = block.split("\n")
        parsed.append((event.removeprefix("event: "), json.loads(data.removeprefix("data: "))))
    return parsed


def test_assess_streams_progress_then_question(monkeypatch):
    fake_stream_json(monkeypatch, QUESTION, tokens=45)

    assert events() == [
        ("status", {"text": assess.STATUS}),
        ("status", {"text": f"{assess.STATUS} ~20 Wörter gedacht"}),
        ("status", {"text": f"{assess.STATUS} ~40 Wörter gedacht"}),
        ("done", QUESTION),
    ]


def test_assess_streams_reasoning_in_chunks(monkeypatch):
    async def stream_hermes_json(message, schema, session_id, instructions=None):
        for _ in range(5):
            yield "reasoning", "x" * 50
        yield "result", schema(**QUESTION)

    monkeypatch.setattr(assess.hermes, "stream_hermes_json", stream_hermes_json)

    assert ("reasoning", {"text": "x" * 200}) in events()


def test_assess_sends_student_data_and_instructions_to_hermes(monkeypatch):
    calls = fake_stream_json(monkeypatch, FINISHED)

    events([{"question": "Do you prefer listening or reading?", "answer": "Listening"}])

    assert "Peter" in calls[0]["message"]
    assert "Do you prefer listening or reading?" in calls[0]["message"]
    assert calls[0]["instructions"] == assess.INSTRUCTIONS
    assert calls[0]["session_id"].startswith("lip-assess-")


def test_assess_sends_only_the_start_of_the_material(monkeypatch):
    calls = fake_stream_json(monkeypatch, QUESTION)
    material = "a" * assess.MATERIAL_PREVIEW_CHARS + "TAIL"

    client.post("/api/assess", json={"profile": PROFILE, "answers": [], "material": material})

    assert f"<material>\n{'a' * assess.MATERIAL_PREVIEW_CHARS}\n</material>" in calls[0]["message"]
    assert "TAIL" not in calls[0]["message"]


def test_assess_asks_hermes_to_finish_after_max_questions(monkeypatch):
    calls = fake_stream_json(monkeypatch, FINISHED)
    answers = [{"question": f"Q{i}", "answer": "A"} for i in range(assess.MAX_QUESTIONS)]

    assert events(answers)[-1] == ("done", FINISHED)
    assert calls[0]["message"].endswith(assess.LAST_TURN)


def test_assess_ends_with_default_theme_when_last_turn_returns_a_question(monkeypatch):
    fake_stream_json(monkeypatch, QUESTION)
    answers = [{"question": f"Q{i}", "answer": "A"} for i in range(assess.MAX_QUESTIONS)]

    assert events(answers)[-1] == ("done", DEFAULT_FINISHED)


def test_assess_returns_picked_themes_when_done(monkeypatch):
    fake_stream_json(monkeypatch, FINISHED)

    assert events()[-1] == ("done", FINISHED)


def test_assess_lists_every_theme_in_instructions():
    for name in themes.THEMES:
        assert f"- {name} (" in assess.INSTRUCTIONS


def test_assess_treats_incomplete_question_as_done(monkeypatch):
    replies = [
        {"done": False, "question": "", "options": ["A", "B"]},
        {"done": False, "question": "Pick one?", "options": []},
    ]

    for reply in replies:
        fake_stream_json(monkeypatch, reply)

        assert events()[-1] == ("done", DEFAULT_FINISHED)


def test_assess_drops_themes_sent_with_a_question(monkeypatch):
    fake_stream_json(monkeypatch, {**QUESTION, "themes": PICKS})

    assert events()[-1] == ("done", QUESTION)


@pytest.mark.parametrize(
    "reply",
    [
        {"done": True, "question": "", "options": [], "themes": []},
        {"done": True, "question": "", "options": [], "themes": [{"theme": "songs", "reason": "x"}]},
        {"done": True, "question": "", "options": [], "themes": PICKS + PICKS},
    ],
)
def test_next_question_rejects_bad_theme_picks(reply):
    with pytest.raises(ValidationError):
        assess.NextQuestion(**reply)


def test_assess_reports_hermes_failure(monkeypatch):
    fake_stream_json(monkeypatch, QUESTION, error=hermes.HermesError("Hermes did not return valid JSON"))

    assert events()[-1] == ("error", {"message": "Morph hat nicht geantwortet. Versuch es nochmal."})


def test_assess_rejects_request_without_profile():
    response = client.post("/api/assess", json={"answers": []})

    assert response.status_code == 422
