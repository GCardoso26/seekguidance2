"""API administrativa."""

from __future__ import annotations

from typing import Any

from app.admin.audit import list_audit_logs
from app.admin.business_analytics import business_analytics
from app.admin.dashboard import platform_stats
from app.admin.moderation import ban_user, moderate_tournament
from app.analytics.marketplace_dashboard import marketplace_dashboard
from app.api.deps import DbSession
from app.api.deps_admin import require_admin
from app.jobs.card_sync import run_card_sync
from app.notifications.service import notification_service
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import text

router = APIRouter(tags=["admin"], prefix="/runtime/judge/admin")


class BanBody(BaseModel):
    reason: str = ""


class ModerateBody(BaseModel):
    action: str  # cancel | pause | resume


class BroadcastBody(BaseModel):
    title: str
    body: str


@router.get("/stats")
async def admin_stats(session: DbSession, admin_id: str = Depends(require_admin)) -> dict[str, Any]:
    return await platform_stats(session)


@router.get("/analytics")
async def admin_analytics(
    session: DbSession,
    admin_id: str = Depends(require_admin),
    period: str = "30d",
) -> dict[str, Any]:
    base = await business_analytics(session, period=period)
    days = base.get("periodDays", 30)
    marketplace = await marketplace_dashboard(session, days=days)
    return {**base, "marketplace": marketplace}


@router.get("/analytics/dashboard")
async def admin_analytics_dashboard(
    session: DbSession,
    admin_id: str = Depends(require_admin),
    days: int = 30,
) -> dict[str, Any]:
    return await marketplace_dashboard(session, days=days)


@router.get("/analytics/retention")
async def admin_analytics_retention(
    session: DbSession,
    admin_id: str = Depends(require_admin),
    days: int = 30,
) -> dict[str, Any]:
    from app.analytics.retention import retention_metrics

    return await retention_metrics(session, days=days)


@router.get("/users")
async def admin_users(
    session: DbSession,
    admin_id: str = Depends(require_admin),
    limit: int = 50,
) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            text(
                """
                SELECT p.id, p.handle, p.display_name, jp.role, p.created_at
                FROM tcg_judge.player_profiles p
                JOIN tcg_judge.judge_profiles jp ON jp.id = p.id
                ORDER BY p.created_at DESC LIMIT :lim
                """
            ),
            {"lim": limit},
        )
    ).mappings().all()
    return [dict(r) for r in rows]


@router.post("/users/{user_id}/ban")
async def admin_ban_user(
    session: DbSession,
    user_id: str,
    body: BanBody,
    admin_id: str = Depends(require_admin),
) -> dict[str, Any]:
    return await ban_user(session, admin_id, user_id, reason=body.reason)


@router.post("/tournaments/{tournament_id}/moderate")
async def admin_moderate_tournament(
    session: DbSession,
    tournament_id: str,
    body: ModerateBody,
    admin_id: str = Depends(require_admin),
) -> dict[str, Any]:
    return await moderate_tournament(session, admin_id, tournament_id, action=body.action)


@router.post("/sync-cards")
async def admin_sync_cards(
    admin_id: str = Depends(require_admin),
    game: str | None = None,
) -> dict[str, Any]:
    return await run_card_sync(game)


@router.post("/broadcast")
async def admin_broadcast(
    session: DbSession,
    body: BroadcastBody,
    admin_id: str = Depends(require_admin),
) -> dict[str, Any]:
    rows = (
        await session.execute(text("SELECT id FROM tcg_judge.player_profiles LIMIT 500"))
    ).mappings().all()
    ids = [r["id"] for r in rows]
    sent = await notification_service.send(
        session,
        "platform:broadcast",
        player_ids=ids,
        body=body.body,
        data={"title": body.title},
        channels=["in_app", "push"],
    )
    await session.commit()
    return {"sent": sent}


@router.get("/payments")
async def admin_payments(
    session: DbSession,
    admin_id: str = Depends(require_admin),
    limit: int = 50,
) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            text(
                """
                SELECT tp.*, t.name AS tournament_name
                FROM tcg_judge.tournament_payments tp
                JOIN tcg_judge.tournaments t ON t.id = tp.tournament_id
                ORDER BY tp.created_at DESC LIMIT :lim
                """
            ),
            {"lim": limit},
        )
    ).mappings().all()
    return [dict(r) for r in rows]


@router.get("/logs")
async def admin_logs(
    session: DbSession,
    admin_id: str = Depends(require_admin),
) -> list[dict[str, Any]]:
    return await list_audit_logs(session)
