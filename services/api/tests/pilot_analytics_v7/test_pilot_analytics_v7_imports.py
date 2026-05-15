"""pilot_analytics_v7."""
from __future__ import annotations

from app.observability.pilot_analytics.pilot_runtime_analytics_v1 import pilot_runtime_analytics_v1_stub


def test_pilot_analytics_v7_payload() -> None:
    p = pilot_runtime_analytics_v1_stub("scope")
    assert p["runtime_confidence"] > 0
    assert "assistant_notes" in p
