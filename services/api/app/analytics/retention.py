"""Métricas de retenção e funil para decisão de produto."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.analytics.marketplace_dashboard import marketplace_dashboard

FUNNEL_EVENTS = (
    "page_view",
    "search",
    "search_used",
    "card_view",
    "add_to_cart",
    "purchase",
)


async def _count_event(session: AsyncSession, event: str, since: datetime) -> int:
    if event == "search":
        row = (
            await session.execute(
                text(
                    """
                    SELECT COUNT(*)::int AS c
                    FROM tcg_judge.analytics_events
                    WHERE timestamp >= :since
                      AND event IN ('search', 'search_used')
                    """
                ),
                {"since": since},
            )
        ).mappings().first()
    else:
        row = (
            await session.execute(
                text(
                    """
                    SELECT COUNT(*)::int AS c
                    FROM tcg_judge.analytics_events
                    WHERE timestamp >= :since AND event = :event
                    """
                ),
                {"since": since, "event": event},
            )
        ).mappings().first()
    return int(row["c"] or 0) if row else 0


async def retention_metrics(session: AsyncSession, *, days: int = 30) -> dict[str, Any]:
    days = max(1, min(days, 90))
    since = datetime.now(UTC) - timedelta(days=days)

    dau_rows = (
        await session.execute(
            text(
                """
                SELECT
                  DATE_TRUNC('day', timestamp)::date AS day,
                  COUNT(DISTINCT COALESCE(user_id, anonymous_id, session_id))::int AS users
                FROM tcg_judge.analytics_events
                WHERE timestamp >= :since
                GROUP BY 1
                ORDER BY 1
                """
            ),
            {"since": since},
        )
    ).mappings().all()

    wau_row = (
        await session.execute(
            text(
                """
                SELECT COUNT(DISTINCT COALESCE(user_id, anonymous_id, session_id))::int AS c
                FROM tcg_judge.analytics_events
                WHERE timestamp >= :since7
                """
            ),
            {"since7": datetime.now(UTC) - timedelta(days=7)},
        )
    ).mappings().first()

    mau_row = (
        await session.execute(
            text(
                """
                SELECT COUNT(DISTINCT COALESCE(user_id, anonymous_id, session_id))::int AS c
                FROM tcg_judge.analytics_events
                WHERE timestamp >= :since
                """
            ),
            {"since": since},
        )
    ).mappings().first()

    page_views = await _count_event(session, "page_view", since)
    searches = await _count_event(session, "search", since)
    card_views = await _count_event(session, "card_view", since)
    add_to_carts = await _count_event(session, "add_to_cart", since)
    purchases = await _count_event(session, "purchase", since)

    funnel = {
        "page_views": page_views,
        "searches": searches,
        "card_views": card_views,
        "add_to_carts": add_to_carts,
        "purchases": purchases,
    }

    funnel_rates = {
        "search_rate": round((searches / max(page_views, 1)) * 100, 2),
        "detail_rate": round((card_views / max(searches, 1)) * 100, 2),
        "cart_rate": round((add_to_carts / max(card_views, 1)) * 100, 2),
        "purchase_rate": round((purchases / max(add_to_carts, 1)) * 100, 2),
        "overall_conversion": round((purchases / max(page_views, 1)) * 100, 2),
    }

    avg_session_row = (
        await session.execute(
            text(
                """
                SELECT ROUND(AVG(duration_sec)::numeric, 1) AS avg_sec
                FROM (
                  SELECT EXTRACT(EPOCH FROM (MAX(timestamp) - MIN(timestamp))) AS duration_sec
                  FROM tcg_judge.analytics_events
                  WHERE timestamp >= :since
                    AND session_id IS NOT NULL
                  GROUP BY session_id
                  HAVING COUNT(*) > 1
                ) s
                """
            ),
            {"since": since},
        )
    ).mappings().first()

    cohort_rows = (
        await session.execute(
            text(
                """
                WITH first_seen AS (
                  SELECT
                    COALESCE(user_id, anonymous_id) AS uid,
                    DATE_TRUNC('week', MIN(timestamp))::date AS cohort_week
                  FROM tcg_judge.analytics_events
                  WHERE COALESCE(user_id, anonymous_id) IS NOT NULL
                    AND timestamp >= :since
                  GROUP BY 1
                ),
                activity AS (
                  SELECT
                    COALESCE(user_id, anonymous_id) AS uid,
                    DATE_TRUNC('week', timestamp)::date AS activity_week
                  FROM tcg_judge.analytics_events
                  WHERE timestamp >= :since
                    AND COALESCE(user_id, anonymous_id) IS NOT NULL
                  GROUP BY 1, 2
                )
                SELECT
                  f.cohort_week,
                  COUNT(DISTINCT f.uid)::int AS cohort_size,
                  COUNT(DISTINCT CASE
                    WHEN a.activity_week = f.cohort_week + 7 THEN f.uid
                  END)::int AS retained_week_1,
                  COUNT(DISTINCT CASE
                    WHEN a.activity_week = f.cohort_week + 14 THEN f.uid
                  END)::int AS retained_week_2,
                  COUNT(DISTINCT CASE
                    WHEN a.activity_week = f.cohort_week + 28 THEN f.uid
                  END)::int AS retained_week_4
                FROM first_seen f
                LEFT JOIN activity a ON a.uid = f.uid
                GROUP BY f.cohort_week
                ORDER BY f.cohort_week DESC
                LIMIT 8
                """
            ),
            {"since": since},
        )
    ).mappings().all()

    xp_rows = (
        await session.execute(
            text(
                """
                SELECT current_level::text AS current_level, COUNT(*)::int AS count
                FROM tcg_judge.user_xp
                GROUP BY current_level
                ORDER BY
                  CASE current_level::text
                    WHEN 'bronze' THEN 1
                    WHEN 'silver' THEN 2
                    WHEN 'gold' THEN 3
                    WHEN 'platinum' THEN 4
                    WHEN 'judge' THEN 5
                    ELSE 6
                  END
                """
            )
        )
    ).mappings().all()

    top_sellers = (
        await session.execute(
            text(
                """
                SELECT
                  s.owner_id AS seller_id,
                  COALESCE(p.display_name, p.handle, s.owner_id) AS seller_name,
                  COUNT(*)::int AS orders,
                  COALESCE(SUM(o.total_cents), 0)::bigint AS gmv_cents
                FROM tcg_judge.shop_orders o
                JOIN tcg_judge.stores s ON s.id = o.store_id
                LEFT JOIN tcg_judge.player_profiles p ON p.id = s.owner_id
                WHERE o.status = 'paid' AND o.created_at >= :since
                GROUP BY s.owner_id, p.display_name, p.handle
                ORDER BY gmv_cents DESC
                LIMIT 10
                """
            ),
            {"since": since},
        )
    ).mappings().all()

    marketplace = await marketplace_dashboard(session, days=days)

    return {
        "period_days": days,
        "dau_by_day": [
            {"day": str(r["day"]), "users": int(r["users"])} for r in dau_rows
        ],
        "wau": int(wau_row["c"] or 0) if wau_row else 0,
        "mau": int(mau_row["c"] or 0) if mau_row else 0,
        "avg_session_seconds": float(avg_session_row["avg_sec"] or 0) if avg_session_row else 0.0,
        "funnel": funnel,
        "funnel_rates": funnel_rates,
        "cohort_retention": [
            {
                "cohort_week": str(r["cohort_week"]),
                "cohort_size": int(r["cohort_size"]),
                "retained_week_1": int(r["retained_week_1"]),
                "retained_week_2": int(r["retained_week_2"]),
                "retained_week_4": int(r["retained_week_4"]),
            }
            for r in cohort_rows
        ],
        "xp_distribution": [
            {"current_level": str(r["current_level"]), "count": int(r["count"])}
            for r in xp_rows
        ],
        "gmv_cents": marketplace["gmv_cents"],
        "gmv_brl": marketplace["gmv_brl"],
        "top_sellers": [
            {
                "seller_id": str(r["seller_id"]),
                "seller_name": str(r["seller_name"]),
                "orders": int(r["orders"]),
                "gmv_brl": round(int(r["gmv_cents"] or 0) / 100, 2),
            }
            for r in top_sellers
        ],
    }
