"""Métricas de marketplace para dashboard admin."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

MARKETPLACE_EVENTS = frozenset(
    {
        "page_view",
        "card_view",
        "search",
        "add_to_cart",
        "purchase",
        "listing_create",
    }
)


async def marketplace_dashboard(session: AsyncSession, *, days: int = 30) -> dict[str, Any]:
    days = max(1, min(days, 90))
    since = datetime.now(UTC) - timedelta(days=days)

    dau_row = (
        await session.execute(
            text(
                """
                SELECT COUNT(DISTINCT COALESCE(user_id, anonymous_id)) AS c
                FROM tcg_judge.analytics_events
                WHERE timestamp >= :since
                """
            ),
            {"since": since},
        )
    ).mappings().first()

    events_by_type = (
        await session.execute(
            text(
                """
                SELECT event, COUNT(*)::int AS cnt
                FROM tcg_judge.analytics_events
                WHERE timestamp >= :since
                GROUP BY event
                ORDER BY cnt DESC
                """
            ),
            {"since": since},
        )
    ).mappings().all()

    searches = (
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

    purchases = (
        await session.execute(
            text(
                """
                SELECT COUNT(*)::int AS c
                FROM tcg_judge.analytics_events
                WHERE timestamp >= :since AND event = 'purchase'
                """
            ),
            {"since": since},
        )
    ).mappings().first()

    search_count = int(searches["c"] or 0) if searches else 0
    purchase_count = int(purchases["c"] or 0) if purchases else 0
    conversion_rate = round((purchase_count / search_count) * 100, 2) if search_count else 0.0

    gmv_row = (
        await session.execute(
            text(
                """
                SELECT COALESCE(SUM(total_cents), 0)::bigint AS gmv_cents,
                       COUNT(*)::int AS orders
                FROM tcg_judge.shop_orders
                WHERE status = 'paid' AND created_at >= :since
                """
            ),
            {"since": since},
        )
    ).mappings().first()

    top_cards = (
        await session.execute(
            text(
                """
                SELECT
                  COALESCE(properties->>'card_name', properties->>'card_id', 'Desconhecida') AS card_name,
                  COUNT(*)::int AS purchases
                FROM tcg_judge.analytics_events
                WHERE timestamp >= :since
                  AND event = 'purchase'
                GROUP BY 1
                ORDER BY purchases DESC
                LIMIT 10
                """
            ),
            {"since": since},
        )
    ).mappings().all()

    marketplace_events = sum(
        int(r["cnt"])
        for r in events_by_type
        if str(r["event"]) in MARKETPLACE_EVENTS
    )

    return {
        "period_days": days,
        "dau": int(dau_row["c"] or 0) if dau_row else 0,
        "total_events": sum(int(r["cnt"]) for r in events_by_type),
        "marketplace_events": marketplace_events,
        "conversion_rate": conversion_rate,
        "searches": search_count,
        "purchases": purchase_count,
        "gmv_cents": int(gmv_row["gmv_cents"] or 0) if gmv_row else 0,
        "gmv_brl": round(int(gmv_row["gmv_cents"] or 0) / 100, 2) if gmv_row else 0,
        "paid_orders": int(gmv_row["orders"] or 0) if gmv_row else 0,
        "events_by_type": {str(r["event"]): int(r["cnt"]) for r in events_by_type},
        "top_cards": [
            {"card_name": str(r["card_name"]), "purchases": int(r["purchases"])}
            for r in top_cards
        ],
    }
