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
    store = await resolve_owner_store(session, owner_id)
    store_id = str(store["id"])
    result = await search_game_cards(
        session,
        game,
        q=q or "",
        page=page,
        limit=min(limit, 48),
    )
    cards = list(result.get("cards") or [])
    card_ids = [str(c.get("id")) for c in cards if c.get("id")]
    inventory = await _store_inventory_by_card(session, store_id, card_ids)
    for card in cards:
        cid = str(card.get("id") or "")
        inv = inventory.get(cid)
        if inv:
            card["my_quantity"] = inv["quantity"]
            card["my_price_cents"] = inv["price_cents"]
            card["my_listed"] = True
        else:
            card["my_quantity"] = 0
            card["my_price_cents"] = None
            card["my_listed"] = False
        # Normaliza campos snake_case usados no grid seller
        if card.get("lowest_price_cents") is None and card.get("lowestPrice") is not None:
            try:
                card["lowest_price_cents"] = int(round(float(card["lowestPrice"]) * 100))
            except (TypeError, ValueError):
                pass
        if not card.get("set_name") and isinstance(card.get("set"), dict):
            card["set_name"] = card["set"].get("name") or card["set"].get("code")
        if not card.get("image_url"):
            uris = card.get("imageUris") or {}
            card["image_url"] = uris.get("normal") or uris.get("large") or uris.get("small")
    return {
        "cards": cards,
        "total": result.get("total", 0),
        "page": page,
        "limit": limit,
        "has_more": result.get("hasMore", False),
    }


async def _store_inventory_by_card(
    session: AsyncSession,
    store_id: str,
    card_ids: list[str],
) -> dict[str, dict[str, Any]]:
    if not card_ids:
        return {}
    rows = (
        await session.execute(
            text(
                """
                WITH listing_agg AS (
                  SELECT cl.card_id::text AS card_id,
                         COALESCE(SUM(cl.quantity), 0)::int AS qty,
                         MIN(cl.price_cents) FILTER (WHERE cl.price_cents > 0)::int AS price_cents
                  FROM tcg_judge.card_listings cl
                  WHERE cl.store_id = :sid
                    AND cl.status = 'active'
                    AND cl.card_id = ANY(CAST(:ids AS uuid[]))
                  GROUP BY cl.card_id
                ),
                product_agg AS (
                  SELECT p.catalog_card_id::text AS card_id,
                         COALESCE(SUM(p.stock), 0)::int AS qty,
                         MIN(p.price_cents) FILTER (WHERE p.price_cents > 0)::int AS price_cents
                  FROM tcg_judge.store_products p
                  WHERE p.store_id = :sid
                    AND p.is_active
                    AND p.catalog_card_id = ANY(CAST(:ids AS uuid[]))
                    AND p.category IN ('single', 'oversized', 'token')
                  GROUP BY p.catalog_card_id
                )
                SELECT COALESCE(l.card_id, p.card_id) AS card_id,
                       COALESCE(l.qty, 0) + COALESCE(p.qty, 0) AS quantity,
                       COALESCE(l.price_cents, p.price_cents) AS price_cents
                FROM listing_agg l
                FULL OUTER JOIN product_agg p ON p.card_id = l.card_id
                """
            ),
            {"sid": store_id, "ids": card_ids},
        )
    ).mappings().all()
    out: dict[str, dict[str, Any]] = {}
    for r in rows:
        cid = str(r["card_id"])
        qty = int(r["quantity"] or 0)
        if qty <= 0 and r["price_cents"] is None:
            continue
        out[cid] = {
            "quantity": qty,
            "price_cents": int(r["price_cents"]) if r["price_cents"] is not None else None,
        }
    return out


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
