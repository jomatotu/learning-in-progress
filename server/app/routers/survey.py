from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel

from app.scale import load_scale

router = APIRouter(tags=["survey"])


class ResponseScale(BaseModel):
    min: int
    max: int
    labels: list[str]


class Category(BaseModel):
    id: str
    title: str
    hint: str


class Question(BaseModel):
    id: str
    category: str
    text: str
    priority: Literal["high", "low"]


class Card(BaseModel):
    text: str
    reason: str


class MediumCard(BaseModel):
    text: str


class DeckEntry(BaseModel):
    category: str
    title: str
    low: Card
    medium: MediumCard
    high: Card


class Survey(BaseModel):
    version: str
    response_scale: ResponseScale
    categories: list[Category]
    questions: list[Question]
    deck: list[DeckEntry]


def _localised(entry: dict, key: str, lang: str):
    # German texts live next to the English ones as "<key>_de"; English is the fallback.
    return entry.get(f"{key}_{lang}", entry[key]) if lang != "en" else entry[key]


def _card(band: dict, lang: str) -> Card:
    return Card(text=_localised(band, "student_text", lang), reason=_localised(band, "student_reason", lang))


# The survey questions for the client to show, in order, in English or German. Scoring details
# (reversed items, bands, instructions) stay on the server and are the same in both languages.
# The deck is the yes/no mirror cards: band texts for the student only, no AI instructions.
@router.get("/survey")
async def get_survey(lang: Literal["en", "de"] = "en") -> Survey:
    scale = load_scale()
    response_scale = scale["response_scale"]
    return Survey(
        version=scale["version"],
        response_scale=ResponseScale(
            min=response_scale["min"],
            max=response_scale["max"],
            labels=_localised(response_scale, "labels", lang),
        ),
        categories=[
            Category(id=c["id"], title=_localised(c, "title", lang), hint=_localised(c, "hint", lang))
            for c in scale["categories"]
        ],
        questions=[
            Question(
                id=item["id"], category=c["id"], text=_localised(item, "text", lang), priority=item["priority"]
            )
            for c in scale["categories"]
            for item in c["items"]
        ],
        deck=[
            DeckEntry(
                category=c["id"],
                title=_localised(c, "title", lang),
                low=_card(c["bands"]["low"], lang),
                medium=MediumCard(text=_localised(c["bands"]["medium"], "student_text", lang)),
                high=_card(c["bands"]["high"], lang),
            )
            for c in scale["categories"]
        ],
    )
