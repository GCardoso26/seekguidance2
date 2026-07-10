"""Image Health read model — Sprint 16 (RC hardening)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def record_image_event(
    session: AsyncSession,
    *,
    url: str,
    event_type: str,
    latency_ms: int | None = None,
    payload: dict[str, Any] | None = None,
) -> None:
    import hashlib
    import json
    from urllib.parse import urlparse

    parsed = urlparse(url)
    host = parsed.netloc or None
    url_hash = hashlib.sha256(url.encode()).hexdigest()[:64]
    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.image_health_events
              (url_hash, url_host, event_type, latency_ms, payload)
            VALUES (:hash, :host, :etype, :lat, CAST(:payload AS jsonb))
            """
        ),
        {
            "hash": url_hash,
            "host": host,
            "etype": event_type,
            "lat": latency_ms,
            "payload": json.dumps(payload or {}),
        },
    )
    await session.commit()


async def get_image_health_dashboard(session: AsyncSession) -> dict[str, Any]:
    since = datetime.now(UTC) - timedelta(days=7)
    events = (
        await session.execute(
            text(
                """
                SELECT event_type, COUNT(*)::int AS c
                FROM tcg_judge.image_health_events
                WHERE created_at >= :since
                GROUP BY event_type
                ORDER BY c DESC
                """
            ),
            {"since": since},
        )
    ).mappings().all()

    missing_catalog = (
        await session.execute(
            text(
                """
                SELECT COUNT(*)::int AS c
                FROM tcg_judge.card_catalog
                WHERE image_url IS NULL OR trim(image_url) = ''
                """
            )
        )
    ).scalar() or 0

    missing_listings = (
        await session.execute(
            text(
                """
                SELECT COUNT(*)::int AS c
                FROM tcg_judge.card_listings cl
                WHERE cl.status = 'active'
                  AND (cl.images IS NULL OR cardinality(cl.images) = 0)
                """
            )
        )
    ).scalar() or 0

    recent_failures = (
        await session.execute(
            text(
                """
                SELECT url_host, event_type, latency_ms, created_at
                FROM tcg_judge.image_health_events
                WHERE event_type IN ('failure', 'retry', 'missing_alt')
                ORDER BY created_at DESC
                LIMIT 25
                """
            )
        )
    ).mappings().all()

    broken_hosts = (
        await session.execute(
            text(
                """
                SELECT url_host, COUNT(*)::int AS failures
                FROM tcg_judge.image_health_events
                WHERE event_type = 'failure' AND created_at >= :since
                GROUP BY url_host
                ORDER BY failures DESC
                LIMIT 10
                """
            ),
            {"since": since},
        )
    ).mappings().all()

    return {
        "summary": {
            "catalog_missing_images": int(missing_catalog),
            "listings_missing_images": int(missing_listings),
            "events_7d": {str(r["event_type"]): int(r["c"]) for r in events},
        },
        "broken_hosts": [
            {"host": r["url_host"], "failures": int(r["failures"])} for r in broken_hosts if r["url_host"]
        ],
        "recent_events": [
            {
                "host": r["url_host"],
                "event_type": r["event_type"],
                "latency_ms": r["latency_ms"],
                "created_at": r["created_at"].isoformat() if r["created_at"] else None,
            }
            for r in recent_failures
        ],
        "computed_at": datetime.now(UTC).isoformat(),
    }
