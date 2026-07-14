"""Optional DB source adapter — best-effort, never blocks runtime boot."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from app.analytics_runtime.aggregators.engine import SourceSnapshot


async def load_snapshot_from_db(session: Any, *, days: int = 7) -> SourceSnapshot:
    """Best-effort load. On any failure returns empty snapshot (materializer still runs)."""
    from sqlalchemy import text

    since = datetime.now(UTC) - timedelta(days=days)
    events: list[dict[str, Any]] = []
    orders: list[dict[str, Any]] = []
    ahs: dict[str, Any] = {}
    try:
        rows = (
            await session.execute(
                text(
                    """
                    SELECT event, timestamp, user_id, anonymous_id, properties, game_slug, session_id
                    FROM tcg_judge.analytics_events
                    WHERE timestamp >= :since
                    ORDER BY timestamp DESC
                    LIMIT 5000
                    """
                ),
                {"since": since},
            )
        ).mappings().all()
        for r in rows:
            events.append(dict(r))
    except Exception:
        pass

    try:
        orows = (
            await session.execute(
                text(
                    """
                    SELECT id, status, total, buyer_id, seller_id, created_at
                    FROM tcg_judge.shop_orders
                    WHERE created_at >= :since
                    LIMIT 5000
                    """
                ),
                {"since": since},
            )
        ).mappings().all()
        for r in orows:
            orders.append(dict(r))
    except Exception:
        pass

    try:
        from app.judge.analytics_events import ingestion_health_payload

        ahs = await ingestion_health_payload(session, hours=24)
    except Exception:
        ahs = {}

    return SourceSnapshot(
        events=events,
        orders=orders,
        analytics_health=ahs,
        performance={"lighthouse": 95, "lcp_seconds": 1.0},
        availability=0.999,
    )


def demo_snapshot() -> SourceSnapshot:
    """Deterministic fixture for tests / cold start without DB."""
    now = datetime.now(UTC).isoformat()
    s1 = {"session_id": "s1"}
    return SourceSnapshot(
        events=[
            {"event": "page_view", "timestamp": now, "anonymous_id": "a1", "properties": s1},
            {
                "event": "search",
                "timestamp": now,
                "anonymous_id": "a1",
                "properties": {**s1, "result_count": 10},
            },
            {"event": "card_view", "timestamp": now, "anonymous_id": "a1", "properties": s1},
            {
                "event": "add_to_cart",
                "timestamp": now,
                "anonymous_id": "a1",
                "properties": {**s1, "product_id": "p1"},
            },
            {"event": "checkout_started", "timestamp": now, "anonymous_id": "a1", "properties": s1},
            {
                "event": "purchase",
                "timestamp": now,
                "anonymous_id": "a1",
                "user_id": "u1",
                "properties": s1,
            },
            {"event": "wishlist_created", "timestamp": now, "user_id": "u1", "properties": {"name": "main"}},
            {
                "event": "wishlist_converted",
                "timestamp": now,
                "user_id": "u1",
                "properties": {"product_id": "p1"},
            },
            {"event": "listing_create", "timestamp": now, "user_id": "seller1", "properties": {}},
            {
                "event": "search",
                "timestamp": now,
                "anonymous_id": "a2",
                "properties": {"result_count": 0, "zero_results": True},
            },
        ],
        orders=[
            {
                "id": "o1",
                "status": "completed",
                "total": 120.0,
                "buyer_id": "u1",
                "seller_id": "seller1",
                "created_at": now,
            }
        ],
        sellers=[{"id": "seller1"}],
        buyers=[{"id": "u1"}],
        catalog=[{"id": "c1", "game": "mtg"}],
        analytics_health={"persisted": 100, "dead_lettered": 2, "lost": 0, "dlq_pending": 2},
        performance={"lighthouse": 97, "lcp_seconds": 0.9},
        availability=0.999,
    )
