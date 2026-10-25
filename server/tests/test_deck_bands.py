from fastapi.testclient import TestClient

from app.main import app
from app.scale import load_scale

client = TestClient(app)

BASE = {
    "student": {"name": "Peter", "stage": "Schule"},
    "goal": {"type": "", "in_their_words": "", "deadline": None},
    "material": {"topic": "Brüche"},
}


def instructions(category_id, band):
    return next(c for c in load_scale()["categories"] if c["id"] == category_id)["bands"][band]["ai_instructions"]


def post(**extra):
    return client.post("/api/profile", json={**BASE, "answers": {}, **extra})


def test_deck_bands_pick_the_same_instructions_as_the_survey():
    response = post(bands={"attention": "low", "reading": "high", "self_belief": "medium"})

    assert response.status_code == 200
    assert response.json()["learning_instructions"] == {
        "attention": instructions("attention", "low"),
        "reading": instructions("reading", "high"),
        "self_belief": instructions("self_belief", "medium"),
    }


def test_survey_answers_win_over_a_deck_band_for_the_same_category():
    # Worst attention answers give the low band, although the deck said high.
    answers = {"at1": 5, "at2": 1, "at3": 5, "at4": 5}

    response = post(answers=answers, bands={"attention": "high", "reading": "low"})

    assert response.json()["learning_instructions"] == {
        "attention": instructions("attention", "low"),
        "reading": instructions("reading", "low"),
    }


def test_unknown_category_in_bands_is_rejected():
    assert post(bands={"nope": "low"}).status_code == 422


def test_unknown_band_is_rejected():
    assert post(bands={"attention": "extreme"}).status_code == 422


def test_no_answers_and_no_bands_leaves_out_every_category():
    response = post()

    assert response.status_code == 200
    assert response.json()["learning_instructions"] == {}


def test_survey_has_a_german_deck_without_ai_instructions():
    survey = client.get("/api/survey").json()
    deck = survey["deck"]

    assert [d["category"] for d in deck] == [c["id"] for c in survey["categories"]]
    assert len(deck) == 8
    for entry in deck:
        assert set(entry) == {"category", "title", "low", "high"}
        for side in ("low", "high"):
            assert set(entry[side]) == {"text", "reason"}
            assert entry[side]["reason"].startswith("Deshalb ")
    assert deck[0]["low"]["text"].startswith("Das Thema ist für dich")
    assert "ai_instructions" not in str(deck)
