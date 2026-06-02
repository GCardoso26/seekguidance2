"""Resiliência — eventos de fallback e modo degradado."""

from __future__ import annotations

import json
from typing import Any

import structlog
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = structlog.get_logger(__name__)

_degraded: dict[str, bool] = {"redis": False, "postgres": False, "otel": False, "reranker": False}


def mark_degraded(component: str, active: bool = True) -> None:
    _degraded[component] = active


def degraded_status() -> dict[str, bool]:
    return dict(_degraded)


async def record_resilience_event(
    session: AsyncSession,
    event_type: str,
    *,
    component: str | None = None,
    details: dict[str, Any] | None = None,
) -> None:
    try:
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.resilience_events (event_type, component, details)
                VALUES (:event_type, :component, CAST(:details AS jsonb))
                """
            ),
            {
                "event_type": event_type,
                "component": component,
                "details": json.dumps(details or {}),
            },
        )
        await session.commit()
    except Exception:
        logger.warning("resilience_event_failed", exc_info=True)
        try:
            await session.rollback()
        except Exception:
            pass
