import json

from fastapi.testclient import TestClient

from app import hermes
from app.main import app
from app.routers import assess

client = TestClient(app)

PROFILE = {"name": "Peter", "needs": ["ADHD"]}
QUESTION = {"done": False, "question": "Do you prefer listening or reading?", "options": ["Listening", "Reading"]}
FINISHED = {"done": True, "question": "", "options": []}


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
        ("status", {"text": f"{assess.STATUS} ~20 tokens"}),
        ("status", {"text": f"{assess.STATUS} ~40 tokens"}),
        ("done", QUESTION),
    ]


def test_assess_sends_student_data_and_instructions_to_hermes(monkeypatch):
    calls = fake_stream_json(monkeypatch, FINISHED)

    events([{"question": "Do you prefer listening or reading?", "answer": "Listening"}])

    assert "Peter" in calls[0]["message"]
    assert "Do you prefer listening or reading?" in calls[0]["message"]
    assert calls[0]["instructions"] == assess.INSTRUCTIONS
    assert calls[0]["session_id"].startswith("lip-assess-")


def test_assess_stops_after_max_questions_without_calling_hermes(monkeypatch):
    calls = fake_stream_json(monkeypatch, QUESTION)
    answers = [{"question": f"Q{i}", "answer": "A"} for i in range(assess.MAX_QUESTIONS)]

    assert events(answers) == [("done", FINISHED)]
    assert calls == []


def test_assess_treats_incomplete_question_as_done(monkeypatch):
    replies = [
        {"done": False, "question": "", "options": ["A", "B"]},
        {"done": False, "question": "Pick one?", "options": []},
        {"done": True, "question": "Leftover?", "options": ["A", "B"]},
    ]

    for reply in replies:
        fake_stream_json(monkeypatch, reply)

        assert events()[-1] == ("done", FINISHED)


def test_assess_reports_hermes_failure(monkeypatch):
    fake_stream_json(monkeypatch, QUESTION, error=hermes.HermesError("Hermes did not return valid JSON"))

    assert events()[-1] == ("error", {"message": "Hermes didn't answer. Try again."})


def test_assess_rejects_request_without_profile():
    response = client.post("/api/assess", json={"answers": []})

    assert response.status_code == 422
