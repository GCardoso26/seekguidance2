"""API Seller AI — Sprint 12."""

from __future__ import annotations

from typing import Any

from app.api.deps import DbSession
from app.api.v1.tournament_system import _require_user
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(tags=["seller-ai"])


class PrepareActionBody(BaseModel):
    action_type: str = Field(min_length=1, max_length=64)
    insight_id: str | None = None
    payload: dict[str, Any] | None = None


@router.get("/runtime/judge/seller/ai/brief")
async def seller_ai_daily_brief(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    from app.ai.application.seller_ai_service import get_seller_daily_brief

    user_id = _require_user(x_judge_user_id)
    brief = await get_seller_daily_brief(session, user_id)
    return brief.model_dump()


@router.get("/runtime/judge/seller/ai/insights")
async def seller_ai_insights(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    from app.ai.application.seller_ai_service import get_seller_insights

    user_id = _require_user(x_judge_user_id)
    return await get_seller_insights(session, user_id)


@router.post("/runtime/judge/seller/ai/actions/prepare")
async def seller_ai_prepare_action(
    body: PrepareActionBody,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    from app.ai.application.seller_ai_service import prepare_seller_action

    user_id = _require_user(x_judge_user_id)
    try:
        plan = await prepare_seller_action(
            session,
            user_id,
            action_type=body.action_type,
            insight_id=body.insight_id,
            payload=body.payload,
        )
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    return plan.model_dump()
