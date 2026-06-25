"""API pública do catálogo unificado de cartas."""

from __future__ import annotations

from typing import Any

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.deps import DbSession
from app.catalog.admin_auth import require_catalog_sync_auth
from app.catalog.cron_auth import require_catalog_cron_auth
from app.catalog.detail_service import get_card_detail, get_price_history
from app.catalog.health import verify_ingestion, verify_ingestion_lite
from app.catalog.redis_cache import redis_ping
from app.catalog.pipeline import run_full_ingestion, run_game_sync
from app.catalog.search_index import meili_enabled
from app.catalog.search_service import get_catalog_price_trends, list_catalog_sets, search_catalog_cards
from app.pricing.valuation_service import get_card_valuation

router = APIRouter(tags=["card-catalog"])


@router.get("/runtime/judge/catalog/health")
async def catalog_health(
    session: DbSession,
    full: bool = Query(default=False),
) -> dict[str, Any]:
    if full:
        report = await verify_ingestion(session)
    else:
        report = await verify_ingestion_lite(session)
    report["meilisearch"] = "ok" if meili_enabled() else "disabled"
    report["redis"] = redis_ping()
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


@router.get("/runtime/judge/catalog/trends")
async def catalog_price_trends(
    session: DbSession,
    game: str | None = Query(default=None),
    limit: int = Query(default=6, ge=1, le=20),
) -> dict[str, Any]:
    trends = await get_catalog_price_trends(session, limit=limit, game=game)
    return {"trends": trends, "period": "7d", "generated_at": datetime.now(UTC).isoformat()}


@router.get("/runtime/judge/catalog/cards/{card_id}")
async def catalog_card_detail(session: DbSession, card_id: str) -> dict[str, Any]:
    detail = await get_card_detail(session, card_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Card not found")
    return detail


@router.get("/runtime/judge/catalog/cards/{card_id}/valuation")
async def catalog_card_valuation(
    session: DbSession,
    card_id: str,
    condition: str = Query(default="NM"),
) -> dict[str, Any]:
    return await get_card_valuation(session, card_id, condition=condition)


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
    _: None = Depends(require_catalog_sync_auth),
) -> dict[str, Any]:
    return await run_full_ingestion(session, full=full)


@router.post("/runtime/judge/catalog/sync/{game_code}")
async def catalog_sync_game(
    session: DbSession,
    game_code: str,
    full: bool = Query(default=False),
    _: None = Depends(require_catalog_sync_auth),
) -> dict[str, Any]:
    result = await run_game_sync(session, game_code, full=full)
    if result.get("status") == "error" and "não suportado" in str(result.get("message", "")):
        raise HTTPException(400, str(result.get("message")))
    return result


@router.post("/runtime/judge/catalog/cron/sync")
async def catalog_cron_sync_all(
    session: DbSession,
    full: bool = Query(default=False),
    _: None = Depends(require_catalog_cron_auth),
) -> dict[str, Any]:
    """Sync automático de todos os TCGs (GitHub Actions / Vercel Cron)."""
    return await run_full_ingestion(session, full=full)


@router.post("/runtime/judge/catalog/cron/sync/{game_code}")
async def catalog_cron_sync_game(
    session: DbSession,
    game_code: str,
    full: bool = Query(default=False),
    _: None = Depends(require_catalog_cron_auth),
) -> dict[str, Any]:
    """Sync automático de um TCG (GitHub Actions / Vercel Cron)."""
    from app.catalog.games_service import game_code_from_slug
    from app.catalog.pipeline import SYNC_SOURCES

    resolved = game_code_from_slug(game_code) or game_code.upper()
    if resolved not in SYNC_SOURCES:
        raise HTTPException(status_code=404, detail=f"Jogo não suportado: {game_code}")
    result = await run_game_sync(session, resolved, full=full)
    if result.get("status") == "error":
        raise HTTPException(400, str(result.get("message", "sync failed")))
    return result


@router.post("/runtime/judge/catalog/cron/sync-tcgapi-prices")
async def catalog_cron_sync_tcgapi_prices(
    session: DbSession,
    game: str = Query(default="MTG"),
    limit: int = Query(default=50, ge=1, le=200),
    _: None = Depends(require_catalog_cron_auth),
) -> dict[str, Any]:
    """Sync preços externos tcgapi.dev → card_prices (cron Render/Vercel)."""
    from app.pricing.tcgapi_sync import sync_tcgapi_prices

    return await sync_tcgapi_prices(session, game=game, limit=limit)
