"""Buyer Analytics read models — Sprint 15 (CQRS projections)."""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def _upsert_projection(
    session: AsyncSession, user_id: str, key: str, payload: dict[str, Any]
) -> None:
    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.buyer_analytics_projection (user_id, projection_key, payload, computed_at)
            VALUES (:uid, :key, CAST(:payload AS jsonb), NOW())
            ON CONFLICT (user_id, projection_key)
            DO UPDATE SET payload = EXCLUDED.payload, computed_at = EXCLUDED.computed_at
            """
        ),
        {"uid": user_id, "key": key, "payload": json.dumps(payload)},
    )


async def compute_time_to_purchase(session: AsyncSession, user_id: str) -> dict[str, Any]:
    row = (
        await session.execute(
            text(
                """
                SELECT
                  COUNT(*)::int AS orders,
                  AVG(EXTRACT(EPOCH FROM (o.created_at - wi.created_at)))::float AS avg_seconds
                FROM tcg_judge.shop_orders o
                JOIN tcg_judge.wishlist_items wi ON wi.user_id = o.buyer_id
                JOIN tcg_judge.shop_order_items soi ON soi.order_id = o.id AND soi.product_id = wi.product_id
                WHERE o.buyer_id = :uid AND o.status NOT IN ('cancelled', 'failed')
                """
            ),
            {"uid": user_id},
        )
    ).mappings().first()
    orders = int((row or {}).get("orders") or 0)
    avg_sec = float((row or {}).get("avg_seconds") or 0)
    payload = {
        "orders_with_wishlist_path": orders,
        "avg_time_to_purchase_hours": round(avg_sec / 3600, 2) if avg_sec else None,
    }
    await _upsert_projection(session, user_id, "time_to_purchase", payload)
    return payload


async def compute_conversion_funnel(session: AsyncSession, user_id: str) -> dict[str, Any]:
    since = datetime.now(UTC) - timedelta(days=90)
    wishlist = (
        await session.execute(
            text("SELECT COUNT(DISTINCT product_id)::int AS c FROM tcg_judge.wishlist_items WHERE user_id = :uid"),
            {"uid": user_id},
        )
    ).scalar() or 0
    cart = (
        await session.execute(
            text(
                """
                SELECT COALESCE(SUM(quantity), 0)::int AS c
                FROM tcg_judge.shop_cart_items
                WHERE user_id = :uid
                """
            ),
            {"uid": user_id},
        )
    ).scalar() or 0
    orders = (
        await session.execute(
            text(
                """
                SELECT COUNT(*)::int AS c FROM tcg_judge.shop_orders
                WHERE buyer_id = :uid AND created_at >= :since AND status NOT IN ('cancelled', 'failed')
                """
            ),
            {"uid": user_id, "since": since},
        )
    ).scalar() or 0
    payload = {
        "wishlist_items": int(wishlist),
        "cart_units": int(cart),
        "orders_90d": int(orders),
        "wishlist_to_order_rate": round(orders / wishlist, 3) if wishlist else 0,
    }
    await _upsert_projection(session, user_id, "conversion_funnel", payload)
    return payload


async def get_buyer_analytics(session: AsyncSession, user_id: str) -> dict[str, Any]:
    ttp = await compute_time_to_purchase(session, user_id)
    funnel = await compute_conversion_funnel(session, user_id)
    await session.commit()
    return {
        "time_to_purchase": ttp,
        "conversion_funnel": funnel,
        "computed_at": datetime.now(UTC).isoformat(),
    }
