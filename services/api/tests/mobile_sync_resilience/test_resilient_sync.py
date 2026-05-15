"""Mobile sync resilience."""

from __future__ import annotations

from app.mobile_runtime.resilient_sync_runtime import resilient_sync_runtime_stub


def test_resilient_sync() -> None:
    p = resilient_sync_runtime_stub("dev-1")
    assert p["replay_sync_health"]["nominal"] is True
