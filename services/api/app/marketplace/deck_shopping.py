"""Deck Shopping — comprar faltantes / todas (Sprint 14 Epic 8).

Usa coleção do usuário + cards do deck. Não acopla Catalog BC além de IDs já no deck.
Sugere combinação por loja via produtos ativos com nome semelhante (melhor esforço).
"""

from __future__ import annotations

from typing import Any, Literal

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.marketplace.marketplace_hygiene import PUBLIC_LISTING_SQL
from app.marketplace.shop_store import STORE_SELLABLE_SQL


async def _load_deck(session: AsyncSession, deck_id: str, user_id: str) -> dict[str, Any]:
    row = (
        await session.execute(
            text(
                """
                SELECT *
                FROM tcg_judge.decks
                WHERE id = CAST(:id AS uuid)
                  AND (owner_id = :uid OR is_public = true)
                """
            ),
            {"id": deck_id, "uid": user_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Deck não encontrado")
    return dict(row)


async def _deck_cards(session: AsyncSession, deck_id: str) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            text(
                """
                SELECT dc.card_id, dc.quantity, dc.zone,
                       cc.name AS card_name, cc.set_code
                FROM tcg_judge.deck_cards dc
                LEFT JOIN tcg_judge.card_catalog cc ON cc.id = dc.card_id
                WHERE dc.deck_id = CAST(:id AS uuid)
                """
            ),
            {"id": deck_id},
        )
    ).mappings().all()
    return [dict(r) for r in rows]


async def _owned_map(session: AsyncSession, user_id: str) -> dict[str, int]:
    rows = (
        await session.execute(
            text(
                """
                SELECT card_id::text AS card_id, SUM(quantity)::int AS qty
                FROM tcg_judge.user_collections
                WHERE user_id = :uid
                GROUP BY card_id
                """
            ),
            {"uid": user_id},
        )
    ).mappings().all()
    return {str(r["card_id"]): int(r["qty"]) for r in rows}


async def _best_listing_for_name(session: AsyncSession, name: str) -> dict[str, Any] | None:
    if not name:
        return None
    row = (
        await session.execute(
            text(
                f"""
                SELECT p.id, p.name, p.price_cents, p.stock, p.store_id,
                       s.name AS store_name, s.slug AS store_slug,
                       COALESCE(ss.trust_score, 75.0) AS trust_score
                FROM tcg_judge.store_products p
                JOIN tcg_judge.stores s ON s.id = p.store_id
                LEFT JOIN tcg_judge.seller_scores ss ON ss.store_id = s.id
                WHERE p.is_active AND p.stock > 0
                  AND {STORE_SELLABLE_SQL.strip()}
                  AND {PUBLIC_LISTING_SQL.strip()}
                  AND p.name ILIKE :pat
                ORDER BY p.price_cents ASC, ss.trust_score DESC NULLS LAST
                LIMIT 1
                """
            ),
            {"pat": f"%{name[:40]}%"},
        )
    ).mappings().first()
    return dict(row) if row else None


async def build_deck_shopping_plan(
    session: AsyncSession,
    user_id: str,
    deck_id: str,
    *,
    mode: Literal["all", "missing"] = "missing",
) -> dict[str, Any]:
    deck = await _load_deck(session, deck_id, user_id)
    cards = await _deck_cards(session, deck_id)
    owned = await _owned_map(session, user_id)

    needed: dict[str, dict[str, Any]] = {}
    for c in cards:
        cid = str(c["card_id"])
        prev = needed.get(cid)
        qty = int(c.get("quantity") or 0)
        if prev:
            prev["needed"] += qty
        else:
            needed[cid] = {
                "card_id": cid,
                "name": c.get("card_name") or cid,
                "set_code": c.get("set_code"),
                "needed": qty,
                "owned": owned.get(cid, 0),
            }

    lines: list[dict[str, Any]] = []
    owned_lines: list[dict[str, Any]] = []
    missing_lines: list[dict[str, Any]] = []
    estimated = 0
    stores: dict[str, dict[str, Any]] = {}

    for item in needed.values():
        gap = max(0, item["needed"] - item["owned"])
        owned_lines.append({**item, "missing": gap})
        buy_qty = item["needed"] if mode == "all" else gap
        if buy_qty <= 0:
            continue
        listing = await _best_listing_for_name(session, str(item["name"]))
        line = {
            **item,
            "buy_qty": buy_qty,
            "missing": gap,
            "product_id": str(listing["id"]) if listing else None,
            "unit_price_cents": int(listing["price_cents"]) if listing else None,
            "store_id": str(listing["store_id"]) if listing else None,
            "store_name": listing.get("store_name") if listing else None,
            "store_slug": listing.get("store_slug") if listing else None,
            "trust_score": float(listing["trust_score"]) if listing else None,
            "available": bool(listing),
        }
        if listing:
            line_total = int(listing["price_cents"]) * buy_qty
            estimated += line_total
            sid = str(listing["store_id"])
            bucket = stores.setdefault(
                sid,
                {
                    "store_id": sid,
                    "store_name": listing.get("store_name"),
                    "store_slug": listing.get("store_slug"),
                    "trust_score": float(listing.get("trust_score") or 75),
                    "items": [],
                    "subtotal_cents": 0,
                },
            )
            bucket["items"].append(line)
            bucket["subtotal_cents"] += line_total
        missing_lines.append(line)
        lines.append(line)

    return {
        "deck_id": deck_id,
        "deck_name": deck.get("name"),
        "mode": mode,
        "owned": owned_lines,
        "to_buy": missing_lines,
        "estimated_value_cents": estimated,
        "best_store_combination": sorted(
            stores.values(),
            key=lambda s: (-s["trust_score"], s["subtotal_cents"]),
        ),
        "actions": {
            "buy_all": {"mode": "all", "href": f"/decks/{deck_id}?shop=all"},
            "buy_missing": {"mode": "missing", "href": f"/decks/{deck_id}?shop=missing"},
        },
        "policy": "Sugestão apenas — usuário confirma itens no carrinho.",
    }
