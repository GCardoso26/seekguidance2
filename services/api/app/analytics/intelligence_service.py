"""Marketplace Intelligence — read APIs Sprint 8."""

from __future__ import annotations

from typing import Any, Literal

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.analytics.churn_scoring import get_churn_at_risk
from app.analytics.pricing_intelligence import get_pricing_suggestions_read
from app.analytics.projections import rebuild_store_projections
from app.marketplace.seller_dashboard import resolve_owner_store

Period = Literal["7d", "30d", "90d"]

_PERIOD_DAYS = {"7d": 7, "30d": 30, "90d": 90}


async def get_sales_insights(
    session: AsyncSession,
    owner_id: str,
    *,
    period: Period = "30d",
) -> dict[str, Any]:
    store = await resolve_owner_store(session, owner_id)
    store_id = str(store["id"])
    days = _PERIOD_DAYS.get(period, 30)

    summary = (
        await session.execute(
            text(
                """
                SELECT
                  COALESCE(SUM(orders_count), 0)::int AS orders,
                  COALESCE(SUM(units_sold), 0)::int AS units,
                  COALESCE(SUM(revenue_cents), 0)::bigint AS revenue_cents,
                  COALESCE(SUM(unique_buyers), 0)::int AS buyers
                FROM tcg_judge.analytics_daily_sales
                WHERE store_id = CAST(:sid AS uuid)
                  AND sale_date >= CURRENT_DATE - CAST(:days AS int)
                """
            ),
            {"sid": store_id, "days": days},
        )
    ).mappings().first()

    if not summary or int(summary["orders"]) == 0:
        await rebuild_store_projections(session, store_id=store_id, trigger_event="OnDemandRead")
        summary = (
            await session.execute(
                text(
                    """
                    SELECT
                      COALESCE(SUM(orders_count), 0)::int AS orders,
                      COALESCE(SUM(units_sold), 0)::int AS units,
                      COALESCE(SUM(revenue_cents), 0)::bigint AS revenue_cents,
                      COALESCE(SUM(unique_buyers), 0)::int AS buyers
                    FROM tcg_judge.analytics_daily_sales
                    WHERE store_id = CAST(:sid AS uuid)
                      AND sale_date >= CURRENT_DATE - CAST(:days AS int)
                    """
                ),
                {"sid": store_id, "days": days},
            )
        ).mappings().first()

    chart = (
        await session.execute(
            text(
                """
                SELECT sale_date AS date, orders_count, revenue_cents, units_sold
                FROM tcg_judge.analytics_daily_sales
                WHERE store_id = CAST(:sid AS uuid)
                  AND sale_date >= CURRENT_DATE - CAST(:days AS int)
                ORDER BY sale_date
                """
            ),
            {"sid": store_id, "days": days},
        )
    ).mappings().all()

    prev = (
        await session.execute(
            text(
                """
                SELECT COALESCE(SUM(revenue_cents), 0)::bigint AS revenue_cents
                FROM tcg_judge.analytics_daily_sales
                WHERE store_id = CAST(:sid AS uuid)
                  AND sale_date >= CURRENT_DATE - CAST(:days AS int) * 2
                  AND sale_date < CURRENT_DATE - CAST(:days AS int)
                """
            ),
            {"sid": store_id, "days": days},
        )
    ).mappings().first()

    revenue = int(summary["revenue_cents"] if summary else 0)
    prev_rev = int(prev["revenue_cents"] if prev else 0)
    trend_pct = round((revenue - prev_rev) / prev_rev * 100, 1) if prev_rev else 0.0

    intel = (
        await session.execute(
            text(
                "SELECT * FROM tcg_judge.seller_intelligence_projection WHERE store_id = CAST(:sid AS uuid)"
            ),
            {"sid": store_id},
        )
    ).mappings().first()

    return {
        "period": period,
        "summary": {
            "orders": int(summary["orders"] if summary else 0),
            "units_sold": int(summary["units"] if summary else 0),
            "revenue_cents": revenue,
            "unique_buyers": int(summary["buyers"] if summary else 0),
            "revenue_trend_pct": trend_pct,
        },
        "chart": [dict(r) for r in chart],
        "projection": dict(intel) if intel else {},
    }


async def get_listing_performance(
    session: AsyncSession,
    owner_id: str,
    *,
    limit: int = 30,
    sort: str = "revenue",
) -> dict[str, Any]:
    store = await resolve_owner_store(session, owner_id)
    store_id = str(store["id"])
    order_clause = {
        "revenue": "revenue_cents DESC",
        "sales": "sales_count DESC",
        "conversion": "conversion_rate DESC",
    }.get(sort, "revenue_cents DESC")

    rows = (
        await session.execute(
            text(
                f"""
                SELECT *
                FROM tcg_judge.analytics_listing_performance
                WHERE store_id = CAST(:sid AS uuid)
                ORDER BY {order_clause}
                LIMIT :lim
                """
            ),
            {"sid": store_id, "lim": limit},
        )
    ).mappings().all()

    if not rows:
        await rebuild_store_projections(session, store_id=store_id, trigger_event="OnDemandRead")
        rows = (
            await session.execute(
                text(
                    f"""
                    SELECT *
                    FROM tcg_judge.analytics_listing_performance
                    WHERE store_id = CAST(:sid AS uuid)
                    ORDER BY {order_clause}
                    LIMIT :lim
                    """
                ),
                {"sid": store_id, "lim": limit},
            )
        ).mappings().all()

    return {"items": [dict(r) for r in rows], "total": len(rows)}


async def get_intelligence_dashboard(
    session: AsyncSession,
    owner_id: str,
    *,
    period: Period = "30d",
) -> dict[str, Any]:
    store = await resolve_owner_store(session, owner_id)
    store_id = str(store["id"])
    sales = await get_sales_insights(session, owner_id, period=period)
    listings = await get_listing_performance(session, owner_id, limit=10)
    pricing = await get_pricing_suggestions_read(session, store_id=store_id)
    churn = await get_churn_at_risk(session, store_id=store_id)
    return {
        "sales": sales,
        "top_listings": listings["items"][:10],
        "pricing_suggestions": pricing["items"][:10],
        "pricing_opportunities": pricing.get("opportunities", 0),
        "at_risk_buyers": churn["items"][:10],
        "at_risk_count": churn["total"],
    }
