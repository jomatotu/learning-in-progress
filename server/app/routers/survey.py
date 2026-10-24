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


class Survey(BaseModel):
    version: str
    response_scale: ResponseScale
    categories: list[Category]
    questions: list[Question]


# The survey questions for the client to show, in order. Scoring details (reversed items, bands, instructions)
# stay on the server.
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
    )
