"""Endpoints públicos da API para lojistas (plano Pro+)."""

from __future__ import annotations

from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.marketplace.shop_store import store_plan_has_feature


async def _store_for_owner(session: AsyncSession, owner_id: str) -> dict[str, Any]:
    row = (
        await session.execute(
            text(
                """
                SELECT * FROM tcg_judge.stores
                WHERE owner_id = :oid
                ORDER BY created_at ASC
                LIMIT 1
                """
            ),
            {"oid": owner_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Loja não encontrada")
    store = dict(row)
    if not store_plan_has_feature(store, "api"):
        raise HTTPException(403, "API lojista disponível no plano Pro ou superior")
    return store


async def seller_store_summary(session: AsyncSession, owner_id: str) -> dict[str, Any]:
    store = await _store_for_owner(session, owner_id)
    return {
        "id": str(store["id"]),
        "name": store.get("name"),
        "slug": store.get("slug"),
        "plan": store.get("subscription_plan"),
        "shop_enabled": bool(store.get("shop_enabled")),
    }


async def seller_list_products(session: AsyncSession, owner_id: str, *, limit: int = 50) -> list[dict[str, Any]]:
    store = await _store_for_owner(session, owner_id)
    rows = (
        await session.execute(
            text(
                """
                SELECT id, name, sku, category, price_cents, stock, is_active, created_at
                FROM tcg_judge.store_products
                WHERE store_id = :sid
                ORDER BY created_at DESC
                LIMIT :lim
                """
            ),
            {"sid": str(store["id"]), "lim": min(limit, 200)},
        )
    ).mappings().all()
    return [dict(r) for r in rows]


async def seller_list_orders(session: AsyncSession, owner_id: str, *, limit: int = 50) -> list[dict[str, Any]]:
    store = await _store_for_owner(session, owner_id)
    rows = (
        await session.execute(
            text(
                """
                SELECT id, buyer_id, status, total_cents, payment_method,
                       use_escrow, created_at, updated_at
                FROM tcg_judge.shop_orders
                WHERE store_id = :sid
                ORDER BY created_at DESC
                LIMIT :lim
                """
            ),
            {"sid": str(store["id"]), "lim": min(limit, 200)},
        )
    ).mappings().all()
    return [dict(r) for r in rows]
