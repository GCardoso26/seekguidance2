"""API de jogos do catálogo — /runtime/judge/catalog/games."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.deps import DbSession
from app.catalog.admin_auth import require_catalog_sync_auth
from app.catalog.games_service import (
    get_catalog_game,
    list_catalog_games,
    list_game_sets,
    search_game_cards,
)
from app.catalog.pipeline import run_game_sync

router = APIRouter(tags=["catalog-games"])


@router.get("/runtime/judge/catalog/games")
async def list_games(session: DbSession) -> dict[str, Any]:
    games = await list_catalog_games(session)
    return {"games": games}


@router.get("/runtime/judge/catalog/games/{slug}")
async def get_game(session: DbSession, slug: str) -> dict[str, Any]:
    game = await get_catalog_game(session, slug)
    if not game:
        raise HTTPException(404, "Game not found")
    return game


@router.get("/runtime/judge/catalog/games/{slug}/sets")
async def get_game_sets(session: DbSession, slug: str) -> dict[str, Any]:
    game = await get_catalog_game(session, slug)
    if not game:
        raise HTTPException(404, "Game not found")
    sets = await list_game_sets(session, slug)
    return {"game": game["slug"], "sets": sets}


@router.get("/runtime/judge/catalog/games/{slug}/cards")
async def get_game_cards(
    session: DbSession,
    slug: str,
    q: str = Query("", min_length=0),
    set: str | None = Query(default=None, alias="set"),
    rarity: str | None = Query(default=None),
    condition: str | None = Query(default=None),
    price_min: float | None = Query(default=None, alias="price_min"),
    price_max: float | None = Query(default=None, alias="price_max"),
    language: str | None = Query(default=None),
    foil: bool | None = Query(default=None),
    sort: str = Query(default="relevance"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=24, ge=1, le=100),
) -> dict[str, Any]:
    game = await get_catalog_game(session, slug)
    if not game:
        raise HTTPException(404, "Game not found")
    return await search_game_cards(
        session,
        slug,
        q=q,
        set_code=set,
        rarity=rarity,
        condition=condition,
        price_min=price_min,
        price_max=price_max,
        language=language,
        foil=foil,
        sort=sort,
        page=page,
        limit=limit,
    )


@router.post("/runtime/judge/catalog/games/{slug}/sync")
async def sync_game_catalog(
    session: DbSession,
    slug: str,
    full: bool = Query(default=False),
    _: None = Depends(require_catalog_sync_auth),
) -> dict[str, Any]:
    from app.catalog.games_service import game_code_from_slug

    code = game_code_from_slug(slug)
    if not code:
        raise HTTPException(404, "Game not found")
    result = await run_game_sync(session, code, full=full)
    if result.get("status") == "error":
        raise HTTPException(400, str(result.get("message", "sync failed")))
    return result
