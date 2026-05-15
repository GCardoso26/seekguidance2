"""Mobile sync resilience v2."""

from __future__ import annotations

from app.mobile_runtime import replay_sync_resilience_v2_stub


def test_sync_resilience_v2() -> None:
    p = replay_sync_resilience_v2_stub("dev-v2")
    assert p["sync_resilience_score"] > 0
