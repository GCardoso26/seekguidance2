"""API pública do catálogo unificado de cartas."""

from __future__ import annotations

from typing import Any

from app.api.deps import DbSession
from app.api.v1.tournament_system import _require_user
from app.catalog.health import verify_ingestion
from app.catalog.pipeline import run_full_ingestion, run_game_sync
from app.catalog.search_index import meili_enabled
from app.catalog.detail_service import get_card_detail, get_price_history
from app.catalog.search_service import list_catalog_sets, search_catalog_cards
from fastapi import APIRouter, Header, HTTPException, Query

router = APIRouter(tags=["card-catalog"])


@router.get("/runtime/judge/catalog/health")
async def catalog_health(session: DbSession) -> dict[str, Any]:
    report = await verify_ingestion(session)
    report["meilisearch"] = "ok" if meili_enabled() else "disabled"
    return report


@router.get("/runtime/judge/catalog/sets")
async def catalog_sets(
    session: DbSession,
    game: str | None = Query(default=None),
) -> dict[str, Any]:
    sets = await list_catalog_sets(session, game=game)
    return {"sets": sets}


@router.get("/runtime/judge/catalog/cards/search")
async def catalog_search_cards(
    session: DbSession,
    q: str = Query("", min_length=0),
    game: str | None = Query(default=None),
    set: str | None = Query(default=None, alias="set"),
    rarity: str | None = Query(default=None),
    condition: str | None = Query(default=None),
    price_min: float | None = Query(default=None, alias="price_min"),
    price_max: float | None = Query(default=None, alias="price_max"),
    language: str | None = Query(default=None),
    foil: bool | None = Query(default=None),
    sort: str = Query(default="relevance"),
    card_id: list[str] = Query(default=[]),
    colors: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=24, ge=1, le=100),
) -> dict[str, Any]:
    return await search_catalog_cards(
        session,
        q=q,
        game=game,
        set_code=set,
        rarity=rarity,
        condition=condition,
        price_min=price_min,
        price_max=price_max,
        language=language,
        foil=foil,
        sort=sort,
        card_ids=card_id,
        colors=colors,
        page=page,
        limit=limit,
    )


@router.get("/runtime/judge/catalog/cards/{card_id}")
async def catalog_card_detail(session: DbSession, card_id: str) -> dict[str, Any]:
    detail = await get_card_detail(session, card_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Card not found")
    return detail


@router.get("/runtime/judge/catalog/cards/{card_id}/price-history")
async def catalog_card_price_history(
    session: DbSession,
    card_id: str,
    range: str = Query(default="30d"),
    condition: str | None = Query(default=None),
    foil: bool | None = Query(default=None),
) -> list[dict[str, Any]]:
    history = await get_price_history(
        session,
        card_id,
        range=range,
        condition=condition,
        foil=foil,
    )
    if history is None:
        raise HTTPException(status_code=404, detail="Card not found")
    return history


@router.post("/runtime/judge/catalog/sync")
async def catalog_sync_all(
    session: DbSession,
    full: bool = Query(default=False),
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    _require_user(x_judge_user_id)
    return await run_full_ingestion(session, full=full)


@router.post("/runtime/judge/catalog/sync/{game_code}")
async def catalog_sync_game(
    session: DbSession,
    game_code: str,
    full: bool = Query(default=False),
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    _require_user(x_judge_user_id)
    result = await run_game_sync(session, game_code, full=full)
    if result.get("status") == "error" and "não suportado" in str(result.get("message", "")):
        raise HTTPException(400, str(result.get("message")))
    return result
