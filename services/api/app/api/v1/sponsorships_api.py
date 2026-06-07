"""API de patrocínios."""

from __future__ import annotations

from typing import Any

from app.api.deps import DbSession
from app.api.v1.tournament_system import _require_user
from app.sponsorships.sponsor import create_sponsorship
from fastapi import APIRouter, Header
from pydantic import BaseModel

router = APIRouter(tags=["sponsorships"])


class SponsorBody(BaseModel):
    tier: str  # small | medium | large


@router.post("/runtime/judge/tournaments/{tournament_id}/sponsor")
async def sponsor_tournament(
    session: DbSession,
    tournament_id: str,
    body: SponsorBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await create_sponsorship(session, user_id, tournament_id, body.tier)
