"""API pública v1 para desenvolvedores."""

from __future__ import annotations

from typing import Any

from app.api.deps import DbSession
from app.marketplace.decklists import search_listings
from app.players import store as player_store
from app.public_api.auth import create_api_key, require_api_key
from app.public_api.webhooks import create_webhook, list_webhooks
from app.search.tournaments import search_tournaments
from app.tcg_adapters.registry import get_adapter, normalize_game_code
from app.tournament.flow import get_standings
from app.tournament.store import get_tournament, list_pairings_for_tournament
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import text

router = APIRouter(prefix="/public/v1", tags=["public-api"])


class WebhookCreateBody(BaseModel):
    url: str
    events: list[str]


def _rate_headers(key_info: dict[str, Any]) -> dict[str, str]:
    limit = int(key_info.get("rate_limit_monthly", 10000))
    remaining = int(key_info.get("remaining", 0))
    return {
        "X-RateLimit-Limit": str(limit),
        "X-RateLimit-Remaining": str(remaining),
    }


@router.get("/tournaments")
async def public_tournaments(
    session: DbSession,
    key_info: dict = Depends(require_api_key),
    page: int = Query(default=1, ge=1),
) -> dict[str, Any]:
    items = await search_tournaments(session, limit=20, offset=(page - 1) * 20)
    return {"items": items, "page": page}


@router.get("/tournaments/{tournament_id}")
async def public_tournament_detail(
    session: DbSession,
    tournament_id: str,
    key_info: dict = Depends(require_api_key),
) -> dict[str, Any]:
    t = await get_tournament(session, tournament_id)
    if not t:
        raise HTTPException(404, "Torneio não encontrado")
    return dict(t)


@router.get("/tournaments/{tournament_id}/standings")
async def public_standings(
    session: DbSession,
    tournament_id: str,
    key_info: dict = Depends(require_api_key),
) -> list[dict[str, Any]]:
    return await get_standings(session, tournament_id)


@router.get("/tournaments/{tournament_id}/pairings")
async def public_pairings(
    session: DbSession,
    tournament_id: str,
    key_info: dict = Depends(require_api_key),
) -> list[dict[str, Any]]:
    rows = await list_pairings_for_tournament(session, tournament_id)
    return [r.__dict__ if hasattr(r, "__dict__") else dict(r) for r in rows]


@router.get("/players/{handle}")
async def public_player(
    session: DbSession,
    handle: str,
    key_info: dict = Depends(require_api_key),
) -> dict[str, Any]:
    prof = await player_store.get_profile_by_handle(session, handle)
    if not prof:
        raise HTTPException(404, "Jogador não encontrado")
    return prof


@router.get("/leaderboards/{game_code}/{format_code}")
async def public_leaderboard(
    session: DbSession,
    game_code: str,
    format_code: str,
    key_info: dict = Depends(require_api_key),
) -> dict[str, Any]:
    entries = await player_store.get_leaderboard(session, game_code, format_code)
    return {"entries": entries}


@router.get("/cards/{game}/search")
async def public_card_search(
    game: str,
    q: str = Query(..., min_length=1),
    key_info: dict = Depends(require_api_key),
) -> list[dict[str, Any]]:
    code = normalize_game_code(game)
    adapter = get_adapter(code)
    cards = adapter.search_cards(q, limit=20)
    return [c.model_dump() if hasattr(c, "model_dump") else dict(c) for c in cards]


@router.get("/decklists/marketplace")
async def public_marketplace(
    session: DbSession,
    game: str | None = None,
    key_info: dict = Depends(require_api_key),
) -> list[dict[str, Any]]:
    return await search_listings(session, game=game)


@router.post("/developer/api-keys")
async def dev_create_key(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    from app.api.v1.tournament_system import _require_user
    user_id = _require_user(x_judge_user_id)
    return await create_api_key(session, user_id)


@router.post("/developer/webhooks")
async def dev_create_webhook(
    session: DbSession,
    body: WebhookCreateBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    from app.api.v1.tournament_system import _require_user
    user_id = _require_user(x_judge_user_id)
    return await create_webhook(session, user_id, url=body.url, events=body.events)


@router.get("/developer/webhooks")
async def dev_list_webhooks(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> list[dict[str, Any]]:
    from app.api.v1.tournament_system import _require_user
    user_id = _require_user(x_judge_user_id)
    return await list_webhooks(session, user_id)


@router.get("/developer/usage")
async def dev_usage(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    from app.api.v1.tournament_system import _require_user
    user_id = _require_user(x_judge_user_id)
    row = (
        await session.execute(
            text(
                """
                SELECT key_prefix, plan, rate_limit_monthly, usage_count, usage_month
                FROM tcg_judge.api_keys WHERE owner_id = :oid AND revoked_at IS NULL
                ORDER BY created_at DESC LIMIT 1
                """
            ),
            {"oid": user_id},
        )
    ).mappings().first()
    return dict(row) if row else {"usage_count": 0}
