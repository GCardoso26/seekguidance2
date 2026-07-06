"""Catálogo do painel vendedor — busca de cartas, expansões e jogos."""

from __future__ import annotations

from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.catalog.games_service import game_code_from_slug, list_catalog_games, list_game_sets, search_game_cards
from app.marketplace import card_listings as card_listings_svc
from app.marketplace.seller_dashboard import resolve_owner_store

DEFAULT_GAME_CONFIG: dict[str, Any] = {
    "conditions": ["NM", "LP", "MP", "HP", "DM"],
    "languages": ["pt", "en", "jp", "de", "es", "fr", "it"],
    "rarities": ["common", "uncommon", "rare", "mythic", "special"],
}


async def search_catalog_cards(
    session: AsyncSession,
    owner_id: str,
    *,
    game: str,
    q: str | None = None,
    page: int = 1,
    limit: int = 24,
) -> dict[str, Any]:
    await resolve_owner_store(session, owner_id)
    result = await search_game_cards(
        session,
        game,
        q=q or "",
        page=page,
        limit=min(limit, 48),
    )
    cards = result.get("cards") or []
    return {
        "cards": cards,
        "total": result.get("total", 0),
        "page": page,
        "limit": limit,
        "has_more": result.get("hasMore", False),
    }


async def list_expansions(
    session: AsyncSession,
    owner_id: str,
    *,
    game: str,
) -> list[dict[str, Any]]:
    store = await resolve_owner_store(session, owner_id)
    store_id = str(store["id"])
    code = game_code_from_slug(game)
    if not code:
        raise HTTPException(400, "Jogo inválido")

    sets = await list_game_sets(session, game)
    if not sets:
        return []

    rows = (
        await session.execute(
            text(
                """
                SELECT cc.set_code,
                       COUNT(*) FILTER (
                         WHERE EXISTS (
                           SELECT 1 FROM tcg_judge.card_listings cl
                           WHERE cl.card_id = cc.id AND cl.store_id = :sid AND cl.status = 'active'
                         )
                       ) AS store_count,
                       COUNT(*) AS total_count
                FROM tcg_judge.card_catalog cc
                WHERE cc.game_code = :g AND cc.set_code IS NOT NULL
                GROUP BY cc.set_code
                """
            ),
            {"sid": store_id, "g": code},
        )
    ).mappings().all()
    counts = {str(r["set_code"]): int(r["store_count"]) for r in rows}
    totals = {str(r["set_code"]): int(r["total_count"]) for r in rows}

    out: list[dict[str, Any]] = []
    for s in sets:
        code_key = str(s.get("code") or "")
        out.append(
            {
                **s,
                "store_listings_count": counts.get(code_key, 0),
                "catalog_card_count": totals.get(code_key, int(s.get("card_count") or 0)),
            }
        )
    return out


async def import_expansion_listings(
    session: AsyncSession,
    owner_id: str,
    set_code: str,
    *,
    default_price_cents: int = 100,
    game: str | None = None,
) -> dict[str, Any]:
    store = await resolve_owner_store(session, owner_id)
    code = game_code_from_slug(game) if game else None

    clauses = ["set_code = :set"]
    params: dict[str, Any] = {"set": set_code.upper()}
    if code:
        clauses.append("game_code = :g")
        params["g"] = code

    cards = (
        await session.execute(
            text(
                f"""
                SELECT id FROM tcg_judge.card_catalog
                WHERE {' AND '.join(clauses)}
                LIMIT 500
                """
            ),
            params,
        )
    ).mappings().all()

    created = 0
    skipped = 0
    for row in cards:
        card_id = str(row["id"])
        existing = (
            await session.execute(
                text(
                    """
                    SELECT id FROM tcg_judge.card_listings
                    WHERE store_id = :sid AND card_id = :cid AND status = 'active'
                    LIMIT 1
                    """
                ),
                {"sid": str(store["id"]), "cid": card_id},
            )
        ).mappings().first()
        if existing:
            skipped += 1
            continue
        try:
            await card_listings_svc.create_listing(
                session,
                owner_id,
                card_id=card_id,
                condition="NM",
                price_cents=default_price_cents,
                quantity=1,
                foil=False,
                language="pt",
            )
            created += 1
        except HTTPException:
            skipped += 1

    return {"created": created, "skipped": skipped, "set_code": set_code}


async def list_seller_games(session: AsyncSession, owner_id: str) -> list[dict[str, Any]]:
    await resolve_owner_store(session, owner_id)
    games = await list_catalog_games(session, active_only=True)

    cfg_rows = (
        await session.execute(
            text("SELECT game_code, config FROM tcg_judge.catalog_games WHERE config IS NOT NULL")
        )
    ).mappings().all()
    cfg_map = {str(r["game_code"]): r["config"] for r in cfg_rows}

    for game in games:
        raw = cfg_map.get(str(game.get("game_code", "")))
        cfg = raw if isinstance(raw, dict) else {}
        game["config"] = {**DEFAULT_GAME_CONFIG, **cfg}
    return games
