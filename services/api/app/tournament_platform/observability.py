"""Observability emit helpers — names registered in Event Registry."""

from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger("tournament_platform.observability")

TOURNAMENT_PLATFORM_EVENTS = (
    "event_created",
    "ticket_created",
    "ticket_sold",
    "registration_created",
    "checkin_completed",
    "round_started",
    "round_finished",
    "pairing_generated",
    "match_reported",
    "penalty_applied",
    "tournament_finished",
)


def emit(name: str, payload: dict[str, Any] | None = None) -> None:
    """Best-effort emit; never raises into business flow."""
    if name not in TOURNAMENT_PLATFORM_EVENTS:
        logger.warning("unregistered_tournament_platform_event name=%s", name)
    try:
        from app.judge.event_registry import EVENT_REGISTRY

        if name not in EVENT_REGISTRY:
            logger.debug("event_not_in_registry_yet name=%s", name)
    except Exception:
        pass
    logger.info("tp_event name=%s payload=%s", name, payload or {})
