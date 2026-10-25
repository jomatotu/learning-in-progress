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


# The survey questions for the client to show, in order. Scoring details (reversed items, bands, instructions)
# stay on the server. The deck is the yes/no mirror cards: German band texts only, no AI instructions.
@router.get("/survey")
async def get_survey() -> Survey:
    scale = load_scale()
    return Survey(
        version=scale["version"],
        response_scale=ResponseScale(**scale["response_scale"]),
        categories=[Category(id=c["id"], title=c["title"], hint=c["hint"]) for c in scale["categories"]],
        questions=[
            Question(id=item["id"], category=c["id"], text=item["text"], priority=item["priority"])
            for c in scale["categories"]
            for item in c["items"]
        ],
        deck=[
            DeckEntry(
                category=c["id"],
                title=c["title"],
                low=Card(text=c["bands"]["low"]["student_text"], reason=c["bands"]["low"]["student_reason"]),
                medium=MediumCard(text=c["bands"]["medium"]["student_text"]),
                high=Card(text=c["bands"]["high"]["student_text"], reason=c["bands"]["high"]["student_reason"]),
            )
            for c in scale["categories"]
        ],
    )
