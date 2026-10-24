import json
import math
from dataclasses import dataclass
from functools import cache
from pathlib import Path
from typing import Any

# The survey: questions, scoring rules, and the instructions for each result. The client gets the questions from GET /api/survey.
SCALE_PATH = Path(__file__).resolve().parent / "data" / "scale.json"


@cache
def load_scale() -> dict[str, Any]:
    return json.loads(SCALE_PATH.read_text(encoding="utf-8"))


@dataclass
class CategoryResult:
    id: str
    name: str
    score: int | None
    band: str
    ai_instructions: list[str]


def item_ids() -> set[str]:
    return {item["id"] for category in load_scale()["categories"] for item in category["items"]}


def _band_for(score: int) -> str:
    for band in load_scale()["scoring"]["bands"]:
        if band["min"] <= score <= band["max"]:
            return band["id"]
    return "high"


# Scores one category: reverse the marked items, average the answers, scale to 0-100, and pick a band.
# Done here, never by the AI, so the same answers always give the same profile.
def score_category(category: dict[str, Any], answers: dict[str, int]) -> CategoryResult:
    low, high = load_scale()["response_scale"]["min"], load_scale()["response_scale"]["max"]
    values = [
        low + high - answers[item["id"]] if item["reverse"] else answers[item["id"]]
        for item in category["items"]
        if item["id"] in answers
    ]
    if not values:
        return CategoryResult(category["id"], category["name"], None, "unknown", [])

    mean = sum(values) / len(values)
    # Round half up, so 62.5 becomes 63 (Python's round() would give 62).
    score = math.floor((mean - low) / (high - low) * 100 + 0.5)
    band = _band_for(score)
    return CategoryResult(category["id"], category["name"], score, band, category["bands"][band]["ai_instructions"])


def evaluate(answers: dict[str, int]) -> list[CategoryResult]:
    return [score_category(category, answers) for category in load_scale()["categories"]]
