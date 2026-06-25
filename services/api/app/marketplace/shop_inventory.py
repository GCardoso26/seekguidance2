"""Dashboard de estoque — produtos físicos + listagens de cartas."""

from __future__ import annotations

from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def _assert_store_owner(session: AsyncSession, store_id: str, owner_id: str) -> None:
    row = (
        await session.execute(
            text("SELECT id FROM tcg_judge.stores WHERE id = :id AND owner_id = :oid"),
            {"id": store_id, "oid": owner_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Loja não encontrada")


async def inventory_summary(session: AsyncSession, store_id: str, owner_id: str) -> dict[str, Any]:
    await _assert_store_owner(session, store_id, owner_id)

    products = (
        await session.execute(
            text(
                """
                SELECT
                  COUNT(*) AS total_products,
                  COUNT(*) FILTER (WHERE stock <= 0) AS out_of_stock,
                  COUNT(*) FILTER (WHERE stock > 0 AND stock <= 3) AS low_stock,
                  COALESCE(SUM(stock * price_cents), 0) AS inventory_value_cents
                FROM tcg_judge.store_products
                WHERE store_id = :sid AND is_active
                """
            ),
            {"sid": store_id},
        )
    ).mappings().first()

    listings = (
        await session.execute(
            text(
                """
                SELECT
                  COUNT(*) AS active_listings,
                  COALESCE(SUM(quantity), 0) AS total_cards,
                  COALESCE(SUM(price_cents * quantity), 0) AS listings_value_cents
                FROM tcg_judge.card_listings
                WHERE seller_id = :oid AND status = 'active'
                """
            ),
            {"oid": owner_id},
        )
    ).mappings().first()

    low_rows = (
        await session.execute(
            text(
                """
                SELECT id, name, stock, price_cents, sku
                FROM tcg_judge.store_products
                WHERE store_id = :sid AND is_active AND stock <= 3
                ORDER BY stock ASC, name
                LIMIT 20
                """
            ),
            {"sid": store_id},
        )
    ).mappings().all()

    return {
        "products": dict(products) if products else {},
        "listings": dict(listings) if listings else {},
        "low_stock_products": [dict(r) for r in low_rows],
    }
