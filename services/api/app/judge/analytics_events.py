"""Eventos de analytics — monetização e engagement (Postgres best-effort)."""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from typing import Any

import structlog
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = structlog.get_logger(__name__)

MONETIZATION_EVENTS = frozenset(
    {
        "pricing_page_view",
        "pricing_toggle",
        "pricing_cta_click",
        "pricing_start_free",
        "paywall_hit",
        "upgrade_modal_open",
        "upgrade_modal_close",
        "checkout_started",
        "checkout_completed",
        "checkout_failed",
        "subscription_cancelled",
        "subscription_renewed",
    }
)

ENGAGEMENT_EVENTS = frozenset(
    {
        "question_asked",
        "verdict_shared",
        "source_clicked",
        "feedback_given",
        "favorite_saved",
        "game_changed",
        "search_used",
        "history_opened",
    }
)

JUDGE_ASSISTANT_EVENTS = frozenset(
    {
        "report_created",
        "report_resolved",
        "ruling_applied",
        "deck_validated",
    }
)

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

ALL_ANALYTICS_EVENTS = MONETIZATION_EVENTS | ENGAGEMENT_EVENTS | JUDGE_ASSISTANT_EVENTS | MARKETPLACE_EVENTS

VALID_TIERS = frozenset({"free", "pro", "team"})


async def record_analytics_events(session: AsyncSession, events: list[dict[str, Any]]) -> int:
    inserted = 0
    for raw in events:
        event_name = str(raw.get("event") or "").strip()
        if event_name not in ALL_ANALYTICS_EVENTS:
            continue
        tier = str(raw.get("tier") or "free")
        if tier not in VALID_TIERS:
            tier = "free"
        ts_raw = raw.get("timestamp")
        try:
            ts = datetime.fromisoformat(str(ts_raw).replace("Z", "+00:00")) if ts_raw else datetime.now(UTC)
        except ValueError:
            ts = datetime.now(UTC)
        user_id = raw.get("user_id")
        anonymous_id = raw.get("anonymous_id")
        properties = raw.get("properties") or {}
        if not isinstance(properties, dict):
            properties = {}
        game_slug = raw.get("game_slug") or properties.get("game_slug")
        session_id = properties.get("session_id") or raw.get("session_id")
        url = properties.get("url") or raw.get("url")
        referrer = properties.get("referrer") or raw.get("referrer")
        user_agent = properties.get("user_agent") or raw.get("user_agent")
        try:
            await session.execute(
                text(
                    """
                    INSERT INTO tcg_judge.analytics_events
                      (event, timestamp, user_id, anonymous_id, properties, tier, game_slug,
                       session_id, url, referrer, user_agent)
                    VALUES
                      (:event, :timestamp, :user_id, :anonymous_id,
                       CAST(:properties AS jsonb), :tier, :game_slug,
                       :session_id, :url, :referrer, :user_agent)
                    """
                ),
                {
                    "event": event_name,
                    "timestamp": ts,
                    "user_id": str(user_id) if user_id else None,
                    "anonymous_id": str(anonymous_id) if anonymous_id else None,
                    "properties": json.dumps(properties) if properties else None,
                    "tier": tier,
                    "game_slug": str(game_slug) if game_slug else None,
                    "session_id": str(session_id) if session_id else None,
                    "url": str(url)[:2000] if url else None,
                    "referrer": str(referrer)[:2000] if referrer else None,
                    "user_agent": str(user_agent)[:500] if user_agent else None,
                },
            )
            inserted += 1
        except Exception:
            logger.warning("analytics_event_record_failed", event=event_name, exc_info=True)
    if inserted:
        try:
            await session.commit()
        except Exception:
            logger.warning("analytics_events_commit_failed", exc_info=True)
            try:
                await session.rollback()
            except Exception:
                pass
            return 0
    return inserted


async def record_marketplace_event(
    session: AsyncSession,
    event_name: str,
    *,
    user_id: str | None = None,
    properties: dict[str, Any] | None = None,
) -> bool:
    """Regista um evento de marketplace (server-side)."""
    if event_name not in MARKETPLACE_EVENTS:
        return False
    count = await record_analytics_events(
        session,
        [
            {
                "event": event_name,
                "timestamp": datetime.now(UTC).isoformat(),
                "user_id": user_id,
                "properties": properties or {},
            }
        ],
    )
    return count > 0


async def monetization_metrics_payload(session: AsyncSession, days: int = 30) -> dict[str, Any]:
    since = datetime.now(UTC) - timedelta(days=max(1, min(days, 90)))
    events = list(MONETIZATION_EVENTS)
    placeholders = ", ".join(f":e{i}" for i in range(len(events)))
    params: dict[str, Any] = {f"e{i}": e for i, e in enumerate(events)}
    params["since"] = since
    try:
        summary_rows = (
            await session.execute(
                text(
                    f"""
                    SELECT
                      event,
                      COUNT(*)::int AS cnt,
                      COUNT(DISTINCT COALESCE(user_id::text, anonymous_id))::int AS unique_users
                    FROM tcg_judge.analytics_events
                    WHERE timestamp >= :since
                      AND event IN ({placeholders})
                    GROUP BY event
                    """
                ),
                params,
            )
        ).mappings().all()

        daily_rows = (
            await session.execute(
                text(
                    f"""
                    SELECT
                      DATE_TRUNC('day', timestamp)::date AS day,
                      event,
                      COUNT(*)::int AS cnt
                    FROM tcg_judge.analytics_events
                    WHERE timestamp >= :since
                      AND event IN ({placeholders})
                    GROUP BY 1, 2
                    ORDER BY 1 DESC
                    """
                ),
                params,
            )
        ).mappings().all()

        pricing_views = 0
        cta_clicks = 0
        checkout_started = 0
        checkout_completed = 0
        paywall_hits = 0
        start_free = 0
        by_event: dict[str, int] = {}

        for row in summary_rows:
            event = str(row["event"])
            cnt = int(row["cnt"])
            by_event[event] = cnt
            if event == "pricing_page_view":
                pricing_views = cnt
            elif event == "pricing_cta_click":
                cta_clicks = cnt
            elif event == "checkout_started":
                checkout_started = cnt
            elif event == "checkout_completed":
                checkout_completed = cnt
            elif event == "paywall_hit":
                paywall_hits = cnt
            elif event == "pricing_start_free":
                start_free = cnt

        conversion_rate = (checkout_completed / pricing_views) if pricing_views else 0.0
        cta_rate = (cta_clicks / pricing_views) if pricing_views else 0.0

        return {
            "window_days": days,
            "pricing_page_views": pricing_views,
            "pricing_cta_clicks": cta_clicks,
            "pricing_start_free": start_free,
            "paywall_hits": paywall_hits,
            "checkout_started": checkout_started,
            "checkout_completed": checkout_completed,
            "conversion_rate": round(conversion_rate, 4),
            "cta_rate": round(cta_rate, 4),
            "events_by_type": by_event,
            "daily": [
                {
                    "day": str(r["day"]),
                    "event": str(r["event"]),
                    "count": int(r["cnt"]),
                }
                for r in daily_rows
            ],
        }
    except Exception:
        logger.warning("monetization_metrics_query_failed", exc_info=True)
        return _empty_monetization_payload(days)


def _empty_monetization_payload(days: int) -> dict[str, Any]:
    return {
        "window_days": days,
        "pricing_page_views": 0,
        "pricing_cta_clicks": 0,
        "pricing_start_free": 0,
        "paywall_hits": 0,
        "checkout_started": 0,
        "checkout_completed": 0,
        "conversion_rate": 0.0,
        "cta_rate": 0.0,
        "events_by_type": {},
        "daily": [],
    }
