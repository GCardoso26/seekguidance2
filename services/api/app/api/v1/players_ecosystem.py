"""API Fase 3 — perfis, rankings, notificações, pagamentos, analytics, busca, ligas."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from app.analytics.organizer import organizer_dashboard
from app.api.deps import DbSession
from app.api.v1.tournament_system import _require_user
from app.leagues.scoring import get_league_standings
from app.notifications.service import notification_service
from app.payments.tournament_entry import confirm_payment, create_payment_intent, refund_payment
from app.players import store as player_store
from app.search.tournaments import search_tournaments
from fastapi import APIRouter, Header, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import text

router = APIRouter(tags=["players-ecosystem"])


class ProfileCreateBody(BaseModel):
    handle: str = Field(min_length=3, max_length=30)
    display_name: str = Field(min_length=1, max_length=80)
    bio: str | None = None
    favorite_game: str | None = None
    city: str | None = None
    country: str | None = None


class ProfileUpdateBody(BaseModel):
    display_name: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    favorite_game: str | None = None
    city: str | None = None
    country: str | None = None
    timezone: str | None = None
    privacy_level: str | None = None
    birth_date: str | None = None
    state: str | None = None
    favorite_tcgs: list[str] | None = None
    has_completed_onboarding: bool | None = None


class PrivacyBody(BaseModel):
    privacy_level: str = Field(pattern="^(public|friends|private)$")


class PaymentIntentBody(BaseModel):
    tournament_id: str


class PaymentConfirmBody(BaseModel):
    payment_intent_id: str


class NotificationPrefsBody(BaseModel):
    push_enabled: bool | None = None
    email_enabled: bool | None = None
    sms_enabled: bool | None = None
    event_settings: dict[str, Any] | None = None


async def _profile_or_404(session: DbSession, handle: str) -> dict[str, Any]:
    prof = await player_store.get_profile_by_handle(session, handle)
    if not prof:
        raise HTTPException(404, "Jogador não encontrado")
    return prof


def _serialize_my_profile(prof: dict[str, Any]) -> dict[str, Any]:
    birth = prof.get("birth_date")
    birth_iso = birth.isoformat() if hasattr(birth, "isoformat") else (str(birth)[:10] if birth else None)
    return {
        "id": prof["id"],
        "handle": prof["handle"],
        "displayName": prof["display_name"],
        "avatarUrl": prof.get("avatar_url"),
        "bio": prof.get("bio"),
        "favoriteGame": prof.get("favorite_game"),
        "favoriteTcgs": prof.get("favorite_tcgs") or [],
        "hasCompletedOnboarding": bool(prof.get("has_completed_onboarding")),
        "birthDate": birth_iso,
        "state": prof.get("state"),
        "city": prof.get("city"),
        "country": prof.get("country"),
        "timezone": prof.get("timezone"),
        "privacyLevel": prof.get("privacy_level", "public"),
        "location": {
            "city": prof.get("city"),
            "country": prof.get("country"),
            "state": prof.get("state"),
            "timezone": prof.get("timezone"),
        },
    }


@router.get("/runtime/judge/players/me")
async def get_my_profile(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    prof = await player_store.get_profile_by_id(session, user_id)
    if not prof:
        raise HTTPException(404, "Perfil não encontrado. Crie seu perfil primeiro.")
    return _serialize_my_profile(prof)


@router.get("/runtime/judge/players/{handle}")
async def get_public_profile(session: DbSession, handle: str) -> dict[str, Any]:
    prof = await _profile_or_404(session, handle)
    if prof.get("privacy_level") == "private":
        return {
            "handle": prof["handle"],
            "displayName": prof["display_name"],
            "avatarUrl": prof.get("avatar_url"),
            "privacyLevel": "private",
        }
    stats = await player_store.get_game_stats(session, prof["id"])
    rankings = await player_store.get_rankings(session, prof["id"])
    achievements = await player_store.get_achievements(session, prof["id"])
    history = await player_store.get_tournament_history(session, prof["id"], limit=5)
    return {
        "id": prof["id"],
        "handle": prof["handle"],
        "displayName": prof["display_name"],
        "avatarUrl": prof.get("avatar_url"),
        "bio": prof.get("bio"),
        "favoriteGame": prof.get("favorite_game"),
        "favoriteTcgs": prof.get("favorite_tcgs") or [],
        "hasCompletedOnboarding": bool(prof.get("has_completed_onboarding")),
        "birthDate": prof["birth_date"].isoformat() if prof.get("birth_date") else None,
        "state": prof.get("state"),
        "location": {
            "city": prof.get("city"),
            "country": prof.get("country"),
            "state": prof.get("state"),
            "timezone": prof.get("timezone"),
        },
        "stats": stats,
        "rankings": rankings,
        "achievements": achievements,
        "recentTournaments": history,
        "privacyLevel": prof.get("privacy_level", "public"),
    }


@router.get("/runtime/judge/players/{handle}/stats")
async def get_player_stats(session: DbSession, handle: str) -> list[dict[str, Any]]:
    prof = await _profile_or_404(session, handle)
    return await player_store.get_game_stats(session, prof["id"])


@router.get("/runtime/judge/players/{handle}/history")
async def get_player_history(
    session: DbSession,
    handle: str,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> dict[str, Any]:
    prof = await _profile_or_404(session, handle)
    if prof.get("privacy_level") == "private":
        raise HTTPException(403, "Histórico privado")
    offset = (page - 1) * page_size
    items = await player_store.get_tournament_history(session, prof["id"], limit=page_size, offset=offset)
    return {"page": page, "pageSize": page_size, "items": items}


@router.get("/runtime/judge/players/{handle}/achievements")
async def get_player_achievements(session: DbSession, handle: str) -> list[dict[str, Any]]:
    prof = await _profile_or_404(session, handle)
    return await player_store.get_achievements(session, prof["id"])


@router.get("/runtime/judge/players/{handle}/rankings")
async def get_player_rankings(session: DbSession, handle: str) -> list[dict[str, Any]]:
    prof = await _profile_or_404(session, handle)
    return await player_store.get_rankings(session, prof["id"])


@router.post("/runtime/judge/players/me")
async def create_my_profile(
    session: DbSession,
    body: ProfileCreateBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    existing = await player_store.get_profile_by_id(session, user_id)
    if existing:
        raise HTTPException(400, "Perfil já existe")
    try:
        prof = await player_store.create_profile(
            session,
            user_id,
            handle=body.handle,
            display_name=body.display_name,
            bio=body.bio,
            favorite_game=body.favorite_game,
            city=body.city,
            country=body.country,
        )
    except ValueError as e:
        raise HTTPException(400, str(e)) from e
    await session.commit()
    created = await player_store.get_profile_by_id(session, user_id)
    if not created:
        raise HTTPException(500, "Perfil criado mas não encontrado")
    return _serialize_my_profile(created)


@router.put("/runtime/judge/players/me")
async def update_my_profile(
    session: DbSession,
    body: ProfileUpdateBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    try:
        await player_store.update_profile(session, user_id, body.model_dump(exclude_none=True))
        await session.commit()
        prof = await player_store.get_profile_by_id(session, user_id)
    except ValueError as e:
        await session.rollback()
        raise HTTPException(404, str(e)) from e
    except Exception as e:
        await session.rollback()
        raise HTTPException(500, f"Erro ao atualizar perfil: {e}") from e
    if not prof:
        raise HTTPException(404, "Perfil não encontrado")
    return _serialize_my_profile(prof)


@router.put("/runtime/judge/players/me/privacy")
async def update_privacy(
    session: DbSession,
    body: PrivacyBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    prof = await player_store.update_profile(session, user_id, {"privacy_level": body.privacy_level})
    await session.commit()
    return prof


@router.get("/runtime/judge/leaderboards/{game_code}/{format_code}")
async def get_leaderboard(
    session: DbSession,
    game_code: str,
    format_code: str,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
) -> dict[str, Any]:
    offset = (page - 1) * page_size
    entries = await player_store.get_leaderboard(
        session, game_code, format_code, limit=page_size, offset=offset
    )
    return {"game": game_code.upper(), "format": format_code.upper(), "entries": entries}


@router.get("/runtime/judge/notifications/me")
async def list_my_notifications(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
    limit: int = Query(default=30, ge=1, le=100),
) -> list[dict[str, Any]]:
    user_id = _require_user(x_judge_user_id)
    rows = (
        await session.execute(
            text(
                """
                SELECT id, event_type, title, body, data, read, sent_at
                FROM tcg_judge.player_notifications
                WHERE player_id = :id
                ORDER BY sent_at DESC LIMIT :lim
                """
            ),
            {"id": user_id, "lim": limit},
        )
    ).mappings().all()
    return [dict(r) for r in rows]


@router.put("/runtime/judge/notifications/preferences")
async def update_notification_preferences(
    session: DbSession,
    body: NotificationPrefsBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    await player_store.ensure_judge_profile(session, user_id)
    sets = []
    params: dict[str, Any] = {"id": user_id}
    if body.push_enabled is not None:
        sets.append("push_enabled = :push")
        params["push"] = body.push_enabled
    if body.email_enabled is not None:
        sets.append("email_enabled = :email")
        params["email"] = body.email_enabled
    if body.sms_enabled is not None:
        sets.append("sms_enabled = :sms")
        params["sms"] = body.sms_enabled
    if body.event_settings is not None:
        import json

        sets.append("event_settings = CAST(:es AS jsonb)")
        params["es"] = json.dumps(body.event_settings)
    if sets:
        await session.execute(
            text(
                f"""
                INSERT INTO tcg_judge.notification_preferences (player_id)
                VALUES (:id) ON CONFLICT (player_id) DO UPDATE SET {', '.join(sets)}, updated_at = NOW()
                """
            ),
            params,
        )
    await session.commit()
    return await notification_service.get_preferences(session, user_id)


@router.post("/runtime/judge/payments/intent")
async def payment_intent(
    session: DbSession,
    body: PaymentIntentBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await create_payment_intent(session, body.tournament_id, user_id)


@router.post("/runtime/judge/payments/confirm")
async def payment_confirm(session: DbSession, body: PaymentConfirmBody) -> dict[str, Any]:
    return await confirm_payment(session, body.payment_intent_id)


@router.post("/runtime/judge/payments/refund")
async def payment_refund(
    session: DbSession,
    tournament_id: str = Query(...),
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    t = (
        await session.execute(
            text("SELECT starts_at FROM tcg_judge.tournaments WHERE id = :id"),
            {"id": tournament_id},
        )
    ).mappings().first()
    starts = t["starts_at"] if t else None
    return await refund_payment(session, tournament_id, user_id, tournament_starts_at=starts)


@router.get("/runtime/judge/organizers/me/analytics")
async def organizer_analytics(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
    days: int = Query(default=90, ge=7, le=365),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await organizer_dashboard(session, user_id, days=days)


@router.get("/runtime/judge/tournaments/search")
async def search_tournaments_endpoint(
    session: DbSession,
    q: str | None = None,
    game: list[str] | None = Query(default=None),
    format: list[str] | None = Query(default=None),
    status: list[str] | None = Query(default=None),
    city: str | None = None,
    country: str | None = None,
    free_only: bool = False,
    max_fee_cents: int | None = None,
    is_official: bool | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    sort_by: str = Query(default="date"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
) -> dict[str, Any]:
    offset = (page - 1) * page_size
    items = await search_tournaments(
        session,
        query=q,
        games=game,
        formats=format,
        status=status,
        city=city,
        country=country,
        free_only=free_only,
        max_fee_cents=max_fee_cents,
        is_official=is_official,
        date_from=date_from,
        date_to=date_to,
        sort_by=sort_by,
        limit=page_size,
        offset=offset,
    )
    return {"page": page, "pageSize": page_size, "items": items}


@router.get("/runtime/judge/leagues/{league_id}/standings")
async def league_standings(session: DbSession, league_id: str) -> list[dict[str, Any]]:
    return await get_league_standings(session, league_id)
