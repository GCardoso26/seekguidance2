"""API de alertas de preço."""

from __future__ import annotations

from typing import Any

from app.alerts import price_alerts as alerts_svc
from app.api.deps import DbSession
from app.api.v1.tournament_system import _require_user
from fastapi import APIRouter, Header, HTTPException, Query
from pydantic import BaseModel, Field

router = APIRouter(tags=["price-alerts"])


class AlertCreateBody(BaseModel):
    card_id: str
    target_price: float = Field(gt=0)
    condition: str = Field(default="below", pattern="^(below|above)$")
    target_condition: str | None = Field(default=None, pattern="^(NM|LP|MP|HP|DM)$")
    target_foil: bool | None = None


class AlertUpdateBody(BaseModel):
    target_price: float | None = Field(default=None, gt=0)
    condition: str | None = Field(default=None, pattern="^(below|above)$")
    status: str | None = Field(default=None, pattern="^(active|disabled)$")


@router.post("/runtime/judge/alerts/price")
async def create_alert(
    session: DbSession,
    body: AlertCreateBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    alert = await alerts_svc.create_price_alert(
        session,
        user_id,
        card_id=body.card_id,
        target_price=body.target_price,
        condition=body.condition,
        target_condition=body.target_condition,
        target_foil=body.target_foil,
    )
    return {"alert": alert}


@router.get("/runtime/judge/alerts/price")
async def list_alerts(
    session: DbSession,
    status: str | None = Query(default=None),
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    alerts = await alerts_svc.list_user_alerts(session, user_id, status=status)
    return {"alerts": alerts}


@router.get("/runtime/judge/alerts/price/{alert_id}")
async def get_alert(
    session: DbSession,
    alert_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    alert = await alerts_svc.get_user_alert(session, user_id, alert_id)
    return {"alert": alert}


@router.patch("/runtime/judge/alerts/price/{alert_id}")
async def patch_alert(
    session: DbSession,
    alert_id: str,
    body: AlertUpdateBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    alert = await alerts_svc.update_price_alert(
        session,
        user_id,
        alert_id,
        target_price=body.target_price,
        condition=body.condition,
        status=body.status,
    )
    return {"alert": alert}


@router.delete("/runtime/judge/alerts/price/{alert_id}")
async def delete_alert(
    session: DbSession,
    alert_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await alerts_svc.delete_price_alert(session, user_id, alert_id)


@router.post("/runtime/judge/alerts/price/check")
async def run_alert_check(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    _require_user(x_judge_user_id)
    return await alerts_svc.check_price_alerts(session)
