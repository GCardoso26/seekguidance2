"""Event registry integration."""

from __future__ import annotations

from app.judge.event_registry import EVENT_REGISTRY
from app.tournament_platform.observability import TOURNAMENT_PLATFORM_EVENTS


def test_bp2_events_registered() -> None:
    for name in TOURNAMENT_PLATFORM_EVENTS:
        assert name in EVENT_REGISTRY, name
        assert EVENT_REGISTRY[name].category == "tournament"
