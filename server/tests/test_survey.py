from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_survey_lists_all_30_questions_in_category_order():
    survey = client.get("/api/survey").json()

    category_ids = [c["id"] for c in survey["categories"]]
    assert len(survey["categories"]) == 8
    assert len(survey["questions"]) == 30
    # Questions come grouped by category, in the same order as the categories.
    seen = list(dict.fromkeys(q["category"] for q in survey["questions"]))
    assert seen == category_ids
    assert survey["response_scale"]["labels"][0] == "Not like me at all"


def test_survey_has_20_high_and_10_low_priority_questions():
    questions = client.get("/api/survey").json()["questions"]

    assert sum(q["priority"] == "high" for q in questions) == 20
    assert sum(q["priority"] == "low" for q in questions) == 10


def test_survey_keeps_scoring_details_on_the_server():
    question = client.get("/api/survey").json()["questions"][0]

    assert set(question) == {"id", "category", "text", "priority"}


def test_survey_questions_are_generic():
    questions = client.get("/api/survey").json()["questions"]

    assert not any("{" in q["text"] for q in questions)
