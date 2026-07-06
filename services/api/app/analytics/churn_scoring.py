"""Churn scoring — compradores recorrentes em risco."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

import structlog
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = structlog.get_logger(__name__)

_INACTIVE_DAYS_MEDIUM = 45
_INACTIVE_DAYS_HIGH = 90


async def compute_churn_scores(
    session: AsyncSession,
    *,
    store_id: str,
    min_orders: int = 2,
) -> dict[str, Any]:
    await session.execute(
        text("DELETE FROM tcg_judge.analytics_churn_scores WHERE store_id = CAST(:sid AS uuid)"),
        {"sid": store_id},
    )

    rows = (
        await session.execute(
            text(
                """
                SELECT
                  o.buyer_id,
                  COUNT(*)::int AS order_count,
                  SUM(o.total_cents)::bigint AS total_spent_cents,
                  MAX(o.created_at) AS last_order_at
                FROM tcg_judge.shop_orders o
                WHERE o.store_id = CAST(:sid AS uuid)
                  AND o.status IN ('paid', 'processing', 'shipped', 'delivered')
                GROUP BY o.buyer_id
                HAVING COUNT(*) >= :min_orders
                """
            ),
            {"sid": store_id, "min_orders": min_orders},
        )
    ).mappings().all()

    now = datetime.now(UTC)
    scored = 0
    for row in rows:
        last = row["last_order_at"]
        if last and last.tzinfo is None:
            last = last.replace(tzinfo=UTC)
        days = (now - last).days if last else 999
        order_count = int(row["order_count"])

        base = min(100.0, days * 1.2)
        if order_count >= 5:
            base *= 0.85
        churn_score = round(min(100.0, max(0.0, base)), 2)

        if days >= _INACTIVE_DAYS_HIGH:
            risk = "high"
        elif days >= _INACTIVE_DAYS_MEDIUM:
            risk = "medium"
        else:
            risk = "low"

        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.analytics_churn_scores (
                  store_id, buyer_id, order_count, total_spent_cents,
                  last_order_at, days_since_last_order, churn_score, risk_level
                ) VALUES (
                  CAST(:sid AS uuid), :buyer, :cnt, :spent,
                  :last, :days, :score, :risk
                )
                """
            ),
            {
                "sid": store_id,
                "buyer": str(row["buyer_id"]),
                "cnt": order_count,
                "spent": int(row["total_spent_cents"] or 0),
                "last": last,
                "days": days,
                "score": churn_score,
                "risk": risk,
            },
        )
        scored += 1

    return {"buyers_scored": scored}


async def get_churn_at_risk(
    session: AsyncSession,
    *,
    store_id: str,
    limit: int = 20,
) -> dict[str, Any]:
    rows = (
        await session.execute(
            text(
                """
                SELECT acs.*, pp.display_name AS buyer_name
                FROM tcg_judge.analytics_churn_scores acs
                LEFT JOIN tcg_judge.player_profiles pp ON pp.id = acs.buyer_id
                WHERE acs.store_id = CAST(:sid AS uuid)
                  AND acs.risk_level IN ('medium', 'high')
                ORDER BY acs.churn_score DESC
                LIMIT :lim
                """
            ),
            {"sid": store_id, "lim": limit},
        )
    ).mappings().all()
    if not rows:
        await compute_churn_scores(session, store_id=store_id)
        rows = (
            await session.execute(
                text(
                    """
                    SELECT acs.*, pp.display_name AS buyer_name
                    FROM tcg_judge.analytics_churn_scores acs
                    LEFT JOIN tcg_judge.player_profiles pp ON pp.id = acs.buyer_id
                    WHERE acs.store_id = CAST(:sid AS uuid)
                      AND acs.risk_level IN ('medium', 'high')
                    ORDER BY acs.churn_score DESC
                    LIMIT :lim
                    """
                ),
                {"sid": store_id, "lim": limit},
            )
        ).mappings().all()
    return {"items": [dict(r) for r in rows], "total": len(rows)}
