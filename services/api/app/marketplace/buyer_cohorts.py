"""Buyer Cohort projections — Sprint 15."""

from __future__ import annotations

import json
from datetime import UTC, date, datetime, timedelta
from typing import Any, Literal

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

CohortPeriod = Literal["daily", "weekly", "monthly", "quarterly"]


def _period_start(period: CohortPeriod) -> datetime:
    now = datetime.now(UTC)
    if period == "daily":
        return now - timedelta(days=1)
    if period == "weekly":
        return now - timedelta(days=7)
    if period == "monthly":
        return now - timedelta(days=30)
    return now - timedelta(days=90)


async def compute_cohort(
    session: AsyncSession,
    *,
    cohort_key: str,
    period: CohortPeriod,
) -> dict[str, Any]:
    since = _period_start(period)
    buyers = (
        await session.execute(
            text(
                """
                SELECT COUNT(DISTINCT buyer_id)::int AS c
                FROM tcg_judge.shop_orders
                WHERE created_at >= :since AND status NOT IN ('cancelled', 'failed')
                """
            ),
            {"since": since},
        )
    ).scalar() or 0
    wishlist_users = (
        await session.execute(
            text(
                """
                SELECT COUNT(DISTINCT user_id)::int AS c
                FROM tcg_judge.wishlist_items
                WHERE created_at >= :since
                """
            ),
            {"since": since},
        )
    ).scalar() or 0
    payload = {
        "active_buyers": int(buyers),
        "wishlist_active_users": int(wishlist_users),
        "period": period,
        "since": since.isoformat(),
    }
    bucket = date.today()
    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.buyer_cohort_projection (cohort_key, period, bucket_date, payload, computed_at)
            VALUES (:key, :period, :bucket, CAST(:payload AS jsonb), NOW())
            ON CONFLICT (cohort_key, period, bucket_date)
            DO UPDATE SET payload = EXCLUDED.payload, computed_at = EXCLUDED.computed_at
            """
        ),
        {"key": cohort_key, "period": period, "bucket": bucket, "payload": json.dumps(payload)},
    )
    await session.commit()
    return payload


async def list_cohorts(session: AsyncSession, *, period: CohortPeriod = "weekly") -> dict[str, Any]:
    rows = (
        await session.execute(
            text(
                """
                SELECT cohort_key, period, payload, computed_at
                FROM tcg_judge.buyer_cohort_projection
                WHERE period = :period
                ORDER BY computed_at DESC
                LIMIT 20
                """
            ),
            {"period": period},
        )
    ).mappings().all()
    if not rows:
        default = await compute_cohort(session, cohort_key="marketplace_buyers", period=period)
        return {"cohorts": [{"cohort_key": "marketplace_buyers", **default}], "period": period}
    return {
        "cohorts": [
            {
                "cohort_key": r["cohort_key"],
                "period": r["period"],
                **(r["payload"] if isinstance(r["payload"], dict) else {}),
                "computed_at": r["computed_at"].isoformat() if r["computed_at"] else None,
            }
            for r in rows
        ],
        "period": period,
    }
