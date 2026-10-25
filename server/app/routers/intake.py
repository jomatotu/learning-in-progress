import asyncio
import hashlib
import hmac
import json
import logging
import re
import secrets
import uuid
from pathlib import Path
from typing import Literal

import openai
from fastapi import APIRouter, HTTPException
from openai import OpenAIError
from pydantic import BaseModel, Field, ValidationError, field_validator

from app import hermes
from app.routers.profile import Goal, Preferences, Student
from app.scale import category_ids, load_scale
from app.settings import get_settings

router = APIRouter(tags=["intake"])

logger = logging.getLogger("uvicorn.error")

PROMPTS = Path(__file__).parent.parent / "prompts"
CARDS_PROMPT = (PROMPTS / "intake_cards.txt").read_text(encoding="utf-8")
SUMMARY_PROMPT = (PROMPTS / "intake_summary.txt").read_text(encoding="utf-8")

CARDS_TIMEOUT_SECONDS = 60
SUMMARY_TIMEOUT_SECONDS = 30
MIN_CARDS, MAX_CARDS, MAX_PATH_CARDS = 3, 7, 3

# ponytail: tokens die on restart (and differ per worker); use a configured secret when intake must survive restarts.
TOKEN_KEY = secrets.token_bytes(32)
TOKEN_PATTERN = re.compile(r"[0-9a-f]{32}\.[0-9a-f]{64}")

ANSWER_LABELS = {"stimmt": "Stimmt", "eher_nicht": "Eher nicht"}


class IntakeRequest(BaseModel):
    student: Student
    goal: Goal
    topic: str = Field(max_length=120)
    preferences: Preferences


class Card(BaseModel):
    id: str = Field(pattern=r"^c\d{1,2}$")
    text: str = Field(min_length=1, max_length=200)
    yes: str | None
    no: str | None


class CardTree(BaseModel):
    cards: list[Card] = Field(min_length=MIN_CARDS, max_length=MAX_CARDS)

    @field_validator("cards")
    @classmethod
    def check_tree(cls, cards: list[Card]) -> list[Card]:
        by_id = {c.id: c for c in cards}
        if len(by_id) != len(cards):
            raise ValueError("Card ids must be unique")
        for c in cards:
            for target in (c.yes, c.no):
                if target is not None and target not in by_id:
                    raise ValueError(f"Card {c.id} points to unknown card {target}")

        reached: set[str] = set()

        # Longest path in cards from `card_id`; fails on a cycle.
        def depth(card_id: str, path: tuple[str, ...]) -> int:
            if card_id in path:
                raise ValueError(f"Cycle at card {card_id}")
            reached.add(card_id)
            c = by_id[card_id]
            return 1 + max((depth(t, (*path, card_id)) for t in (c.yes, c.no) if t), default=0)

        longest = depth(cards[0].id, ())
        if longest > MAX_PATH_CARDS:
            raise ValueError(f"A path is {longest} cards long, at most {MAX_PATH_CARDS} are allowed")
        if unreachable := set(by_id) - reached:
            raise ValueError(f"Cards not reachable from the first card: {', '.join(sorted(unreachable))}")
        return cards


class CardsReply(BaseModel):
    token: str
    cards: list[Card]


class CardAnswer(BaseModel):
    id: str = Field(pattern=r"^c\d{1,2}$")
    answer: Literal["stimmt", "eher_nicht"]


class SummaryRequest(BaseModel):
    token: str
    bands: dict[str, Literal["low", "medium", "high"]] = {}
    card_answers: list[CardAnswer] = Field(default=[], max_length=10)

    @field_validator("bands")
    @classmethod
    def check_bands(cls, bands: dict[str, str]) -> dict[str, str]:
        if unknown := set(bands) - category_ids():
            raise ValueError(f"Unknown categories: {', '.join(sorted(unknown))}")
        return bands


class SummaryModel(BaseModel):
    about_you: str = Field(min_length=1, max_length=1000)


class SummaryReply(BaseModel):
    about_you: str | None


def session_id(session_hex: str) -> str:
    return f"lip-intake-{session_hex}"


def sign(session_hex: str) -> str:
    return f"{session_hex}.{hmac.new(TOKEN_KEY, session_hex.encode(), hashlib.sha256).hexdigest()}"


# Returns the intake session id for a token we issued, else 403. Checked before any Hermes call.
def session_from_token(token: str) -> str:
    session_hex = token.split(".")[0]
    if not TOKEN_PATTERN.fullmatch(token) or not hmac.compare_digest(token, sign(session_hex)):
        raise HTTPException(status_code=403, detail="Das hat nicht geklappt. Starte die Fragen bitte nochmal.")
    return session_id(session_hex)


def intake_model() -> dict[str, str | None]:
    settings = get_settings()
    return {"model": settings.hermes_intake_model, "provider": settings.hermes_intake_provider}


# Asks once, then once more in the same session naming the problem. Returns None when both replies are unusable.
async def ask_checked[T: BaseModel](message: str, schema: type[T], session_id: str) -> T | None:
    for _ in range(2):
        reply = await hermes.ask_hermes(message, session_id=session_id, **intake_model())
        try:
            return schema.model_validate_json(reply)
        except ValidationError as error:
            logger.warning("Intake reply rejected: %s", error.errors(include_url=False, include_input=False))
            message = f"That reply was not valid: {error}\n\nReply again with only the corrected JSON object."
    return None


# Runs one Hermes call with a time limit; any failure to deliver is logged and becomes None.
async def run_intake[T: BaseModel](message: str, schema: type[T], session_id: str, seconds: float) -> T | None:
    try:
        async with asyncio.timeout(seconds):
            return await ask_checked(message, schema, session_id)
    except TimeoutError:
        logger.warning("Intake call timed out after %ss", seconds)
    except openai.AuthenticationError:
        logger.error("Hermes rejected the API key — check HERMES_API_KEY in server/.env")
    except (hermes.HermesError, OpenAIError):
        logger.exception("Intake call failed")
    return None


# Hermes writes the personal yes/no cards. Late or broken cards are left out: the answer is still 200 with no cards.
@router.post("/intake/cards")
async def create_cards(request: IntakeRequest) -> CardsReply:
    session_hex = uuid.uuid4().hex
    data = request.model_dump()
    message = CARDS_PROMPT.replace("{{DATA}}", json.dumps(data, ensure_ascii=False, indent=2))
    tree = await run_intake(message, CardTree, session_id(session_hex), CARDS_TIMEOUT_SECONDS)
    return CardsReply(token=sign(session_hex), cards=tree.cards if tree else [])


# Hermes writes "Das habe ich verstanden" from what the student saw (band texts) and their card answers.
@router.post("/intake/summary")
async def create_summary(request: SummaryRequest) -> SummaryReply:
    session_id = session_from_token(request.token)
    categories = {c["id"]: c for c in load_scale()["categories"]}
    bands = "\n".join(
        f"- {categories[cid]['title']}: {categories[cid]['bands'][band]['student_text']}"
        for cid, band in request.bands.items()
    )
    answers = "\n".join(f"- {a.id}: {ANSWER_LABELS[a.answer]}" for a in request.card_answers)
    message = SUMMARY_PROMPT.replace("{{BANDS}}", bands or "- (none)").replace("{{ANSWERS}}", answers or "- (none)")
    summary = await run_intake(message, SummaryModel, session_id, SUMMARY_TIMEOUT_SECONDS)
    return SummaryReply(about_you=summary.about_you if summary else None)
