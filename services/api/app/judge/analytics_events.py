"""Eventos de analytics — ingestão com paridade FE↔BE, DLQ e sem drop silencioso."""

from __future__ import annotations

import json
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

import structlog
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.judge.event_registry import (
    ALL_ANALYTICS_EVENTS,
    CRITICAL_IDEMPOTENT_EVENTS,
    MARKETPLACE_EVENTS,
    MONETIZATION_EVENTS,
    SUPPORTED_SCHEMA_VERSIONS,
)

logger = structlog.get_logger(__name__)

VALID_TIERS = frozenset({"free", "pro", "team"})

# Re-exports for existing importers
__all__ = [
    "ALL_ANALYTICS_EVENTS",
    "MARKETPLACE_EVENTS",
    "MONETIZATION_EVENTS",
    "record_analytics_events",
    "record_marketplace_event",
    "monetization_metrics_payload",
    "ingestion_health_payload",
]


def _parse_ts(ts_raw: Any) -> datetime:
    try:
        if ts_raw:
            return datetime.fromisoformat(str(ts_raw).replace("Z", "+00:00"))
    except ValueError:
        pass
    return datetime.now(UTC)


def _schema_version(raw: dict[str, Any], properties: dict[str, Any]) -> int | None:
    for key in ("event_schema_version", "schema_version"):
        if key in raw and raw[key] is not None:
            try:
                return int(raw[key])
            except (TypeError, ValueError):
                return None
        if key in properties and properties[key] is not None:
            try:
                return int(properties[key])
            except (TypeError, ValueError):
                return None
    return 1  # backward compatible default


async def _insert_dlq(
    session: AsyncSession,
    *,
    reason: str,
    event_name: str | None,
    event_schema_version: int | None,
    payload: dict[str, Any],
    origin: str | None,
    ingest_trace_id: str,
    error_detail: str | None = None,
) -> bool:
    try:
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.analytics_events_dlq
                  (reason, event_name, event_schema_version, payload, origin,
                   ingest_trace_id, error_detail)
                VALUES
                  (:reason, :event_name, :event_schema_version, CAST(:payload AS jsonb),
                   :origin, :ingest_trace_id, :error_detail)
                """
            ),
            {
                "reason": reason,
                "event_name": event_name,
                "event_schema_version": event_schema_version,
                "payload": json.dumps(payload),
                "origin": (origin or "")[:500] or None,
                "ingest_trace_id": ingest_trace_id,
                "error_detail": (error_detail or "")[:2000] or None,
            },
        )
        return True
    except Exception:
        logger.warning(
            "analytics_dlq_insert_failed",
            reason=reason,
            event=event_name,
            ingest_trace_id=ingest_trace_id,
            exc_info=True,
        )
        return False


async def record_analytics_events(
    session: AsyncSession,
    events: list[dict[str, Any]],
    *,
    origin: str | None = None,
    ingest_trace_id: str | None = None,
) -> dict[str, Any]:
    """Persist events or dead-letter them. Never silently discard.

    Returns counts: received, persisted, dead_lettered, duplicates, lost.
    `lost` must stay 0 when DLQ table is available; otherwise increment.
    """
    trace = ingest_trace_id or str(uuid.uuid4())
    persisted = 0
    dead_lettered = 0
    duplicates = 0
    lost = 0
    details: list[dict[str, Any]] = []

    for raw in events:
        event_name = str(raw.get("event") or "").strip()
        properties = raw.get("properties") or {}
        if not isinstance(properties, dict):
            properties = {}
        version = _schema_version(raw, properties)
        envelope = {**raw, "ingest_trace_id": trace}

        if not event_name:
            ok = await _insert_dlq(
                session,
                reason="missing_event_name",
                event_name=None,
                event_schema_version=version,
                payload=envelope,
                origin=origin or properties.get("url"),
                ingest_trace_id=trace,
            )
            if ok:
                dead_lettered += 1
                details.append({"status": "dead_letter", "reason": "missing_event_name"})
            else:
                lost += 1
                details.append({"status": "lost", "reason": "missing_event_name"})
            continue

        if event_name not in ALL_ANALYTICS_EVENTS:
            ok = await _insert_dlq(
                session,
                reason="unknown_event",
                event_name=event_name,
                event_schema_version=version,
                payload=envelope,
                origin=origin or properties.get("url"),
                ingest_trace_id=trace,
                error_detail=f"Event '{event_name}' not in EVENT_REGISTRY",
            )
            if ok:
                dead_lettered += 1
                details.append({"event": event_name, "status": "dead_letter", "reason": "unknown_event"})
            else:
                lost += 1
                details.append({"event": event_name, "status": "lost", "reason": "unknown_event"})
            continue

        if version is None or version not in SUPPORTED_SCHEMA_VERSIONS:
            ok = await _insert_dlq(
                session,
                reason="invalid_schema_version",
                event_name=event_name,
                event_schema_version=version if isinstance(version, int) else None,
                payload=envelope,
                origin=origin or properties.get("url"),
                ingest_trace_id=trace,
                error_detail=f"Unsupported schema version: {version}",
            )
            if ok:
                dead_lettered += 1
                details.append(
                    {
                        "event": event_name,
                        "status": "dead_letter",
                        "reason": "invalid_schema_version",
                    }
                )
            else:
                lost += 1
            continue

        # Soft required-field checks (v1): timestamp parseable; properties object already ensured
        if raw.get("properties") is not None and not isinstance(raw.get("properties"), dict):
            ok = await _insert_dlq(
                session,
                reason="invalid_payload",
                event_name=event_name,
                event_schema_version=version,
                payload=envelope,
                origin=origin or str(properties.get("url") or ""),
                ingest_trace_id=trace,
                error_detail="properties must be object",
            )
            if ok:
                dead_lettered += 1
            else:
                lost += 1
            details.append({"event": event_name, "status": "dead_letter", "reason": "invalid_payload"})
            continue

        tier = str(raw.get("tier") or "free")
        if tier not in VALID_TIERS:
            tier = "free"
        ts = _parse_ts(raw.get("timestamp"))
        user_id = raw.get("user_id")
        anonymous_id = raw.get("anonymous_id")
        game_slug = raw.get("game_slug") or properties.get("game_slug")
        session_id = properties.get("session_id") or raw.get("session_id")
        url = properties.get("url") or raw.get("url")
        referrer = properties.get("referrer") or raw.get("referrer")
        user_agent = properties.get("user_agent") or raw.get("user_agent")
        idem_key = (
            raw.get("idempotency_key")
            or properties.get("idempotency_key")
            or None
        )
        if idem_key is not None:
            idem_key = str(idem_key)[:128]

        insert_params = {
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
            "event_schema_version": version,
            "idempotency_key": idem_key,
            "ingest_trace_id": trace,
            "source": str(raw.get("source") or "client")[:64],
        }
        try:
            try:
                await session.execute(
                    text(
                        """
                        INSERT INTO tcg_judge.analytics_events
                          (event, timestamp, user_id, anonymous_id, properties, tier, game_slug,
                           session_id, url, referrer, user_agent,
                           event_schema_version, idempotency_key, ingest_trace_id, source)
                        VALUES
                          (:event, :timestamp, :user_id, :anonymous_id,
                           CAST(:properties AS jsonb), :tier, :game_slug,
                           :session_id, :url, :referrer, :user_agent,
                           :event_schema_version, :idempotency_key, :ingest_trace_id, :source)
                        """
                    ),
                    insert_params,
                )
            except Exception as col_exc:
                # Pre-migration rollout: columns may not exist yet — legacy insert.
                if "event_schema_version" not in str(col_exc) and "idempotency_key" not in str(col_exc) and "ingest_trace_id" not in str(col_exc) and "column" not in str(col_exc).lower():
                    raise
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
                    insert_params,
                )
            persisted += 1
            details.append({"event": event_name, "status": "persisted", "schema_version": version})
        except Exception as exc:
            msg = str(exc).lower()
            if idem_key and ("unique" in msg or "duplicate" in msg):
                duplicates += 1
                details.append(
                    {
                        "event": event_name,
                        "status": "duplicate",
                        "idempotency_key": idem_key,
                    }
                )
                logger.info(
                    "analytics_event_duplicate",
                    event=event_name,
                    idempotency_key=idem_key,
                )
                continue

            # Persist failure → DLQ (recoverable)
            ok = await _insert_dlq(
                session,
                reason="persist_failed",
                event_name=event_name,
                event_schema_version=version,
                payload=envelope,
                origin=origin or (str(url) if url else None),
                ingest_trace_id=trace,
                error_detail=str(exc)[:2000],
            )
            if ok:
                dead_lettered += 1
                details.append({"event": event_name, "status": "dead_letter", "reason": "persist_failed"})
            else:
                lost += 1
                details.append({"event": event_name, "status": "lost", "reason": "persist_failed"})
            logger.warning("analytics_event_record_failed", event=event_name, exc_info=True)

    accounted = persisted + dead_lettered + duplicates
    if accounted or lost:
        try:
            await session.commit()
        except Exception:
            logger.warning("analytics_events_commit_failed", exc_info=True)
            try:
                await session.rollback()
            except Exception:
                pass
            return {
                "received": len(events),
                "persisted": 0,
                "dead_lettered": 0,
                "duplicates": 0,
                "lost": len(events),
                "ingest_trace_id": trace,
                "ok": False,
                "details": [{"status": "lost", "reason": "commit_failed"}],
            }

    return {
        "received": len(events),
        "persisted": persisted,
        "dead_lettered": dead_lettered,
        "duplicates": duplicates,
        "lost": lost,
        "ingest_trace_id": trace,
        "ok": lost == 0,
        "details": details,
    }


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
    result = await record_analytics_events(
        session,
        [
            {
                "event": event_name,
                "timestamp": datetime.now(UTC).isoformat(),
                "user_id": user_id,
                "properties": properties or {},
                "event_schema_version": 1,
                "source": "server",
            }
        ],
        origin="server:marketplace",
    )
    return int(result.get("persisted") or 0) > 0


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


async def ingestion_health_payload(session: AsyncSession, hours: int = 24) -> dict[str, Any]:
    """Operational analytics health inputs for AHS."""
    hours = max(1, min(hours, 168))
    since = datetime.now(UTC) - timedelta(hours=hours)
    try:
        persisted = int(
            (
                await session.execute(
                    text(
                        """
                        SELECT COUNT(*)::int AS c
                        FROM tcg_judge.analytics_events
                        WHERE created_at >= :since OR timestamp >= :since
                        """
                    ),
                    {"since": since},
                )
            ).scalar()
            or 0
        )
        dlq_rows = (
            await session.execute(
                text(
                    """
                    SELECT reason, COUNT(*)::int AS c
                    FROM tcg_judge.analytics_events_dlq
                    WHERE created_at >= :since
                    GROUP BY reason
                    """
                ),
                {"since": since},
            )
        ).mappings().all()
        by_reason = {str(r["reason"]): int(r["c"]) for r in dlq_rows}
        dead_lettered = sum(by_reason.values())
        pending = int(
            (
                await session.execute(
                    text(
                        """
                        SELECT COUNT(*)::int AS c
                        FROM tcg_judge.analytics_events_dlq
                        WHERE reprocess_status = 'pending'
                        """
                    )
                )
            ).scalar()
            or 0
        )
        return {
            "window_hours": hours,
            "persisted": persisted,
            "dead_lettered": dead_lettered,
            "dlq_pending": pending,
            "dlq_by_reason": by_reason,
            "registry_size": len(ALL_ANALYTICS_EVENTS),
            "critical_idempotent_events": sorted(CRITICAL_IDEMPOTENT_EVENTS),
        }
    except Exception:
        logger.warning("ingestion_health_query_failed", exc_info=True)
        return {
            "window_hours": hours,
            "persisted": 0,
            "dead_lettered": 0,
            "dlq_pending": 0,
            "dlq_by_reason": {},
            "registry_size": len(ALL_ANALYTICS_EVENTS),
            "critical_idempotent_events": sorted(CRITICAL_IDEMPOTENT_EVENTS),
            "error": "query_failed",
        }
