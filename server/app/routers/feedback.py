from fastapi import APIRouter
from pydantic import BaseModel, Field

from app import learner, themes

router = APIRouter(tags=["feedback"])


class FeedbackRequest(BaseModel):
    student_id: learner.StudentId
    theme: themes.ThemeName
    text: str = Field(min_length=1, max_length=learner.MAX_TEXT_CHARS)


# The student's wish for next time, kept in their notes so Hermes reads it in the next session.
@router.post("/feedback", status_code=204)
async def feedback(request: FeedbackRequest) -> None:
    learner.remember(request.student_id, "feedback", f"{request.theme}: {request.text}")
