"""Projection rebuild — analytics read models Sprint 8."""

from __future__ import annotations

import uuid
from typing import Any

import structlog
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.platform.jobs import emit_outbox_event

logger = structlog.get_logger(__name__)


async def _update_cursor(
    session: AsyncSession,
    *,
    projection_key: str,
    store_id: str | None,
    rows_affected: int,
    last_event_id: str | None = None,
) -> None:
    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.analytics_projection_cursors
              (projection_key, store_id, last_event_id, rows_affected, last_rebuilt_at)
            VALUES (:key, CAST(:sid AS uuid), :eid, :rows, NOW())
            ON CONFLICT (projection_key) DO UPDATE SET
              last_event_id = COALESCE(EXCLUDED.last_event_id, analytics_projection_cursors.last_event_id),
              rows_affected = EXCLUDED.rows_affected,
              last_rebuilt_at = NOW()
            """
        ),
        {"key": projection_key, "sid": store_id, "eid": last_event_id, "rows": rows_affected},
    )


async def rebuild_daily_sales(
    session: AsyncSession,
    *,
    store_id: str,
    days: int = 90,
) -> int:
    await session.execute(
        text(
            """
            DELETE FROM tcg_judge.analytics_daily_sales
            WHERE store_id = CAST(:sid AS uuid)
              AND sale_date >= CURRENT_DATE - CAST(:days AS int)
            """
        ),
        {"sid": store_id, "days": days},
    )
    result = await session.execute(
        text(
            """
            INSERT INTO tcg_judge.analytics_daily_sales
              (store_id, sale_date, orders_count, units_sold, revenue_cents, unique_buyers)
            SELECT
              o.store_id,
              DATE(o.created_at) AS sale_date,
              COUNT(*)::int AS orders_count,
              COALESCE(SUM(
                (SELECT SUM(quantity) FROM tcg_judge.shop_order_items i WHERE i.order_id = o.id)
              ), 0)::int AS units_sold,
              COALESCE(SUM(o.store_receives_cents), 0)::bigint AS revenue_cents,
              COUNT(DISTINCT o.buyer_id)::int AS unique_buyers
            FROM tcg_judge.shop_orders o
            WHERE o.store_id = CAST(:sid AS uuid)
              AND o.status IN ('paid', 'processing', 'shipped', 'delivered')
              AND o.created_at >= NOW() - CAST(:days AS int) * INTERVAL '1 day'
            GROUP BY o.store_id, DATE(o.created_at)
            """
        ),
        {"sid": store_id, "days": days},
    )
    count = result.rowcount or 0
    await _update_cursor(
        session,
        projection_key=f"daily_sales:{store_id}",
        store_id=store_id,
        rows_affected=count,
    )
    return count


async def rebuild_listing_performance(session: AsyncSession, *, store_id: str) -> int:
    owner = (
        await session.execute(
            text("SELECT owner_id FROM tcg_judge.stores WHERE id = CAST(:sid AS uuid)"),
            {"sid": store_id},
        )
    ).mappings().first()
    if not owner:
        return 0
    seller_id = str(owner["owner_id"])

    await session.execute(
        text("DELETE FROM tcg_judge.analytics_listing_performance WHERE store_id = CAST(:sid AS uuid)"),
        {"sid": store_id},
    )

    result = await session.execute(
        text(
            """
            INSERT INTO tcg_judge.analytics_listing_performance (
              store_id, listing_id, card_id, card_name, listing_status,
              price_cents, quantity_available, sales_count, units_sold,
              revenue_cents, views_proxy, conversion_rate, days_since_listed, last_sold_at
            )
            SELECT
              cl.store_id,
              cl.id AS listing_id,
              cl.card_id,
              cc.name AS card_name,
              cl.status AS listing_status,
              cl.price_cents,
              cl.quantity AS quantity_available,
              COALESCE(sales.cnt, 0)::int AS sales_count,
              COALESCE(sales.units, 0)::int AS units_sold,
              COALESCE(sales.revenue, 0)::bigint AS revenue_cents,
              GREATEST(COALESCE(sales.cnt, 0) * 12, 1)::int AS views_proxy,
              CASE
                WHEN GREATEST(COALESCE(sales.cnt, 0) * 12, 1) > 0
                THEN LEAST(1.0, COALESCE(sales.cnt, 0)::numeric / GREATEST(COALESCE(sales.cnt, 0) * 12, 1))
                ELSE 0
              END AS conversion_rate,
              EXTRACT(DAY FROM NOW() - cl.created_at)::int AS days_since_listed,
              sales.last_sold
            FROM tcg_judge.card_listings cl
            JOIN tcg_judge.card_catalog cc ON cc.id = cl.card_id
            LEFT JOIN LATERAL (
              SELECT
                COUNT(DISTINCT o.id)::int AS cnt,
                SUM(oi.quantity)::int AS units,
                SUM(oi.total_price_cents)::bigint AS revenue,
                MAX(o.created_at) AS last_sold
              FROM tcg_judge.shop_orders o
              JOIN tcg_judge.shop_order_items oi ON oi.order_id = o.id
              JOIN tcg_judge.store_products sp ON sp.id = oi.product_id
              WHERE o.store_id = cl.store_id
                AND sp.card_id = cl.card_id
                AND o.status IN ('paid', 'processing', 'shipped', 'delivered')
            ) sales ON TRUE
            WHERE cl.seller_id = :uid
            """
        ),
        {"uid": seller_id},
    )
    count = result.rowcount or 0
    await _update_cursor(
        session,
        projection_key=f"listing_performance:{store_id}",
        store_id=store_id,
        rows_affected=count,
    )
    return count


async def rebuild_store_projections(
    session: AsyncSession,
    *,
    store_id: str,
    correlation_id: str | None = None,
    trigger_event: str | None = None,
) -> dict[str, Any]:
    cid = correlation_id or str(uuid.uuid4())
    daily = await rebuild_daily_sales(session, store_id=store_id)
    listings = await rebuild_listing_performance(session, store_id=store_id)

    await emit_outbox_event(
        session,
        event_type="AnalyticsProjectionRebuilt",
        aggregate_type="Analytics",
        aggregate_id=store_id,
        payload={
            "daily_rows": daily,
            "listing_rows": listings,
            "trigger": trigger_event,
        },
        correlation_id=cid,
    )
    logger.info(
        "analytics_rebuilt",
        store_id=store_id,
        daily_rows=daily,
        listing_rows=listings,
        trigger=trigger_event,
    )
    return {"daily_rows": daily, "listing_rows": listings}
