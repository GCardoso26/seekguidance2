"""API Liga Pass — gamificação e XP."""

from __future__ import annotations

from typing import Any

from app.api.deps import DbSession
from app.api.v1.tournament_system import _require_user
from app.gamification import xp as xp_svc
from fastapi import APIRouter, Header, Query
from pydantic import BaseModel, Field

router = APIRouter(tags=["gamification"])


class AwardXpBody(BaseModel):
    action_type: str = Field(min_length=1, max_length=50)
    description: str | None = None


@router.post("/runtime/judge/gamification/xp/award")
async def award_xp_endpoint(
    session: DbSession,
    body: AwardXpBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await xp_svc.award_xp(session, user_id, body.action_type, body.description)


@router.get("/runtime/judge/gamification/xp/me")
async def get_my_xp(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await xp_svc.get_my_xp(session, user_id)


@router.get("/runtime/judge/gamification/leaderboard")
async def get_leaderboard(
    session: DbSession,
    limit: int = Query(default=50, ge=1, le=100),
) -> list[dict[str, Any]]:
    return await xp_svc.get_leaderboard(session, limit=limit)
