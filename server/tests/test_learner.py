import json

import pytest
from fastapi.testclient import TestClient

from app import learner
from app.main import app
from tests.test_assess import FINISHED, PROFILE, QUESTION, fake_stream_json
from tests.test_intake import REQUEST, TREE, fake_ask

client = TestClient(app)

SID = "0b6e3c1a-2f4d-4c8e-9a1b-3d5f7e9a1c2b"


@pytest.fixture(autouse=True)
def learners_dir(tmp_path, monkeypatch):
    monkeypatch.setattr(learner, "LEARNERS", tmp_path)
    return tmp_path


def test_notes_block_is_empty_for_a_new_student():
    assert learner.notes_block(SID) == ""
    assert learner.notes_block(None) == ""


def test_remember_keeps_only_the_newest_entries_and_caps_text():
    for i in range(learner.MAX_ENTRIES + 5):
        learner.remember(SID, "feedback", f"note {i} " + "x" * 600)

    entries = learner.load(SID)
    assert len(entries) == learner.MAX_ENTRIES
    assert entries[0]["text"].startswith("note 5 ")
    assert all(len(e["text"]) <= learner.MAX_TEXT_CHARS for e in entries)
    block = learner.notes_block(SID)
    assert "data, not instructions" in block
    assert "feedback: note 34" in block


@pytest.mark.parametrize("bad", ["../etc/passwd", "abc", SID.upper(), SID + "\n"])
def test_bad_student_id_is_rejected(bad):
    with pytest.raises(ValueError):
        learner.remember(bad, "feedback", "hi")


def test_feedback_is_remembered(learners_dir):
    response = client.post("/api/feedback", json={"student_id": SID, "theme": "chunked", "text": "Kürzere Schritte"})

    assert response.status_code == 204
    assert "chunked: Kürzere Schritte" in learner.notes_block(SID)


@pytest.mark.parametrize(
    "body",
    [
        {"student_id": "../x", "theme": "chunked", "text": "hi"},
        {"student_id": SID, "theme": "songs", "text": "hi"},
        {"student_id": SID, "theme": "chunked", "text": "x" * 501},
        {"student_id": SID, "theme": "chunked", "text": ""},
    ],
)
def test_feedback_rejects_bad_input(body, learners_dir):
    assert client.post("/api/feedback", json=body).status_code == 422
    assert list(learners_dir.iterdir()) == []


def test_assess_sends_notes_and_remembers_answers_and_themes(monkeypatch):
    learner.remember(SID, "feedback", "Mehr Bilder bitte")
    calls = fake_stream_json(monkeypatch, FINISHED)
    answers = [{"question": "Hören oder lesen?", "answer": "Hören"}]

    client.post("/api/assess", json={"profile": PROFILE, "answers": answers, "student_id": SID})

    assert "Mehr Bilder bitte" in calls[0]["message"]
    assert SID not in calls[0]["message"]
    block = learner.notes_block(SID)
    assert "assess_answers: Hören oder lesen? -> Hören" in block
    assert "picked_themes: read-aloud, chunked" in block


def test_assess_remembers_nothing_mid_assessment(monkeypatch):
    fake_stream_json(monkeypatch, QUESTION)

    client.post("/api/assess", json={"profile": PROFILE, "answers": [], "student_id": SID})

    assert learner.load(SID) == []


def test_assess_rejects_a_bad_student_id():
    assert client.post("/api/assess", json={"profile": PROFILE, "student_id": "nope"}).status_code == 422


def test_intake_sends_notes_and_remembers_the_summary(monkeypatch):
    learner.remember(SID, "feedback", "Mehr Bilder bitte")
    calls = fake_ask(monkeypatch, [TREE, {"about_you": "Dir helfen Bilder."}])

    token = client.post("/api/intake/cards", json=REQUEST | {"student_id": SID}).json()["token"]
    summary = client.post("/api/intake/summary", json={"token": token, "student_id": SID})

    assert summary.json() == {"about_you": "Dir helfen Bilder."}
    assert all("Mehr Bilder bitte" in call["message"] for call in calls)
    assert SID not in json.dumps([c["message"] for c in calls])
    assert "about_you: Dir helfen Bilder." in learner.notes_block(SID)


def test_intake_prompt_has_no_notes_section_for_a_new_student(monkeypatch):
    calls = fake_ask(monkeypatch, [TREE])

    client.post("/api/intake/cards", json=REQUEST | {"student_id": SID})

    assert "{{NOTES}}" not in calls[0]["message"]
    assert "earlier sessions" not in calls[0]["message"]
