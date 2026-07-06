"""Coleta sinais reais para Reputation Engine — não só reviews."""

from __future__ import annotations

from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.marketplace import seller_fulfillment


async def collect_store_signals(session: AsyncSession, store_id: str) -> dict[str, Any]:
    """Agrega sinais de Order, Refund, Dispute, Fulfillment SLA, Reviews."""
    orders = (
        await session.execute(
            text(
                """
                SELECT
                  COUNT(*) FILTER (
                    WHERE status IN ('delivered', 'shipped')
                  )::int AS completed,
                  COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled,
                  COUNT(*) FILTER (WHERE status = 'refunded')::int AS refunded,
                  COUNT(*) FILTER (WHERE status = 'disputed')::int AS disputed,
                  COUNT(*)::int AS total
                FROM tcg_judge.shop_orders
                WHERE store_id = CAST(:sid AS uuid)
                """
            ),
            {"sid": store_id},
        )
    ).mappings().first()

    chargebacks = (
        await session.execute(
            text(
                """
                SELECT
                  COUNT(*) FILTER (
                    WHERE status IN ('opened', 'under_review')
                  )::int AS open_cnt,
                  COUNT(*) FILTER (
                    WHERE opened_at > NOW() - INTERVAL '30 days'
                  )::int AS last_30d
                FROM tcg_judge.chargebacks
                WHERE store_id = CAST(:sid AS uuid)
                """
            ),
            {"sid": store_id},
        )
    ).mappings().first()

    reviews = (
        await session.execute(
            text(
                """
                SELECT average_rating, review_count
                FROM tcg_judge.stores WHERE id = CAST(:sid AS uuid)
                """
            ),
            {"sid": store_id},
        )
    ).mappings().first()

    sla = await seller_fulfillment.get_fulfillment_sla_metrics(session, store_id)
    sla_violations = sum(int(sla.get(k) or 0) for k in (
        "picking_overdue", "packing_overdue", "shipping_overdue", "tracking_delayed"
    ))

    completed = int(orders["completed"] if orders else 0)
    cancelled = int(orders["cancelled"] if orders else 0)
    refunded = int(orders["refunded"] if orders else 0)
    disputed = int(orders["disputed"] if orders else 0)
    total = int(orders["total"] if orders else 0)
    refund_rate = refunded / total if total > 0 else 0.0

    return {
        "orders_completed": completed,
        "orders_cancelled": cancelled,
        "orders_refunded": refunded,
        "orders_total": total,
        "refund_rate": round(refund_rate, 4),
        "disputes_open": disputed,
        "chargebacks_open": int(chargebacks["open_cnt"] if chargebacks else 0),
        "chargebacks_30d": int(chargebacks["last_30d"] if chargebacks else 0),
        "review_avg": float(reviews["average_rating"] if reviews and reviews["average_rating"] else 0),
        "review_count": int(reviews["review_count"] if reviews else 0),
        "sla_violations": sla_violations,
        "sla_detail": sla,
    }
