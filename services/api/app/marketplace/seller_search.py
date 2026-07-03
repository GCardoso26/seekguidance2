"""Busca global do painel lojista."""

from __future__ import annotations

import asyncio
from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.marketplace.seller_dashboard import resolve_owner_store

SearchItem = dict[str, Any]


def _format_order_title(order_id: str) -> str:
    short = order_id.replace("-", "")[:5]
    return f"#{short}"


async def _search_orders(
    session: AsyncSession, store_id: str, q: str, *, limit: int = 5
) -> list[SearchItem]:
    pat = f"%{q}%"
    rows = (
        await session.execute(
            text(
                """
                SELECT o.id, o.status, o.created_at,
                       COALESCE(p.display_name, 'Cliente') AS subtitle
                FROM tcg_judge.shop_orders o
                LEFT JOIN tcg_judge.player_profiles p ON p.id = o.buyer_id
                WHERE o.store_id = :sid
                  AND (
                    o.id::text ILIKE :pat
                    OR COALESCE(p.display_name, '') ILIKE :pat
                    OR COALESCE(p.handle, '') ILIKE :pat
                  )
                ORDER BY o.created_at DESC
                LIMIT :lim
                """
            ),
            {"sid": store_id, "pat": pat, "lim": limit},
        )
    ).mappings().all()
    return [
        {
            "type": "order",
            "id": str(r["id"]),
            "title": _format_order_title(str(r["id"])),
            "subtitle": str(r["subtitle"]),
            "status": str(r["status"]),
            "created_at": r["created_at"].isoformat() if r.get("created_at") else None,
        }
        for r in rows
    ]


async def _search_customers(
    session: AsyncSession, store_id: str, q: str, *, limit: int = 5
) -> list[SearchItem]:
    pat = f"%{q}%"
    rows = (
        await session.execute(
            text(
                """
                SELECT sc.customer_id AS id,
                       COALESCE(sc.display_name, pp.display_name, sc.customer_id) AS title,
                       COALESCE(sc.email, '') AS subtitle,
                       sc.last_order_at AS created_at
                FROM tcg_judge.store_customers sc
                LEFT JOIN tcg_judge.player_profiles pp ON pp.id = sc.customer_id
                WHERE sc.store_id = :sid
                  AND (
                    sc.display_name ILIKE :pat
                    OR sc.email ILIKE :pat
                    OR sc.customer_id ILIKE :pat
                    OR COALESCE(pp.handle, '') ILIKE :pat
                  )
                ORDER BY sc.last_order_at DESC NULLS LAST
                LIMIT :lim
                """
            ),
            {"sid": store_id, "pat": pat, "lim": limit},
        )
    ).mappings().all()
    return [
        {
            "type": "customer",
            "id": str(r["id"]),
            "title": str(r["title"]),
            "subtitle": str(r["subtitle"]) or None,
            "created_at": r["created_at"].isoformat() if r.get("created_at") else None,
        }
        for r in rows
    ]


async def _search_listings(
    session: AsyncSession, store_id: str, q: str, *, limit: int = 5
) -> list[SearchItem]:
    pat = f"%{q}%"
    rows = (
        await session.execute(
            text(
                """
                SELECT cl.id,
                       COALESCE(cc.name, sp.name, 'Carta') AS title,
                       COALESCE(cc.set_name, cc.game_code, '') AS subtitle,
                       cl.created_at
                FROM tcg_judge.card_listings cl
                LEFT JOIN tcg_judge.card_catalog cc ON cc.id = cl.card_id
                LEFT JOIN tcg_judge.store_products sp ON sp.id = cl.store_product_id
                WHERE cl.store_id = :sid
                  AND cl.status = 'active'
                  AND (
                    COALESCE(cc.name, '') ILIKE :pat
                    OR COALESCE(sp.name, '') ILIKE :pat
                  )
                ORDER BY cl.created_at DESC
                LIMIT :lim
                """
            ),
            {"sid": store_id, "pat": pat, "lim": limit},
        )
    ).mappings().all()
    return [
        {
            "type": "listing",
            "id": str(r["id"]),
            "title": str(r["title"]),
            "subtitle": str(r["subtitle"]) or None,
            "created_at": r["created_at"].isoformat() if r.get("created_at") else None,
        }
        for r in rows
    ]


async def _search_products(
    session: AsyncSession, store_id: str, q: str, *, limit: int = 5
) -> list[SearchItem]:
    pat = f"%{q}%"
    rows = (
        await session.execute(
            text(
                """
                SELECT p.id, p.name AS title, p.category AS subtitle, p.created_at
                FROM tcg_judge.store_products p
                WHERE p.store_id = :sid
                  AND p.is_active = TRUE
                  AND p.name ILIKE :pat
                ORDER BY p.created_at DESC
                LIMIT :lim
                """
            ),
            {"sid": store_id, "pat": pat, "lim": limit},
        )
    ).mappings().all()
    return [
        {
            "type": "product",
            "id": str(r["id"]),
            "title": str(r["title"]),
            "subtitle": str(r["subtitle"]) or None,
            "created_at": r["created_at"].isoformat() if r.get("created_at") else None,
        }
        for r in rows
    ]


async def _search_coupons(
    session: AsyncSession, store_id: str, q: str, *, limit: int = 3
) -> list[SearchItem]:
    pat = f"%{q}%"
    try:
        rows = (
            await session.execute(
                text(
                    """
                    SELECT c.id, c.code AS title, c.type AS subtitle, c.created_at
                    FROM tcg_judge.shop_coupons c
                    WHERE c.store_id = :sid AND c.code ILIKE :pat
                    ORDER BY c.created_at DESC
                    LIMIT :lim
                    """
                ),
                {"sid": store_id, "pat": pat, "lim": limit},
            )
        ).mappings().all()
    except Exception:
        return []
    return [
        {
            "type": "coupon",
            "id": str(r["id"]),
            "title": str(r["title"]),
            "subtitle": str(r["subtitle"]) or None,
            "created_at": r["created_at"].isoformat() if r.get("created_at") else None,
        }
        for r in rows
    ]


async def global_search(session: AsyncSession, owner_id: str, q: str) -> dict[str, Any]:
    query = q.strip()
    if len(query) < 2:
        return {"query": query, "categories": {}, "total": 0}

    store = await resolve_owner_store(session, owner_id)
    store_id = str(store["id"])

    orders, customers, listings, products, coupons = await asyncio.gather(
        _search_orders(session, store_id, query),
        _search_customers(session, store_id, query),
        _search_listings(session, store_id, query),
        _search_products(session, store_id, query),
        _search_coupons(session, store_id, query),
    )

    categories = {
        "orders": orders,
        "customers": customers,
        "listings": listings,
        "products": products,
        "coupons": coupons,
    }
    total = sum(len(items) for items in categories.values())
    return {"query": query, "categories": categories, "total": total}
