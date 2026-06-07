"""API de reviews."""

from __future__ import annotations

from typing import Any

from app.api.deps import DbSession
from app.api.v1.tournament_system import _require_user
from app.reviews.review import create_review, list_reviews, upvote_review
from fastapi import APIRouter, Header
from pydantic import BaseModel, Field

router = APIRouter(tags=["reviews"])


class ReviewBody(BaseModel):
    target_type: str = Field(pattern="^(tournament|store|organizer|decklist)$")
    target_id: str
    rating: int = Field(ge=1, le=5)
    comment: str
    title: str | None = None
    categories: dict[str, int] | None = None


@router.post("/runtime/judge/reviews")
async def post_review(
    session: DbSession,
    body: ReviewBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await create_review(
        session, user_id, target_type=body.target_type, target_id=body.target_id,
        rating=body.rating, comment=body.comment, title=body.title, categories=body.categories,
    )


@router.get("/runtime/judge/reviews/{target_type}/{target_id}")
async def get_reviews(session: DbSession, target_type: str, target_id: str) -> list[dict[str, Any]]:
    return await list_reviews(session, target_type, target_id)


@router.post("/runtime/judge/reviews/{review_id}/helpful")
async def helpful_review(session: DbSession, review_id: str) -> dict[str, Any]:
    return await upvote_review(session, review_id)
