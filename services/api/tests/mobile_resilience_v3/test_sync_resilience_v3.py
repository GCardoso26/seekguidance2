"""Mobile resilience v3."""

from __future__ import annotations

from app.mobile_runtime import mobile_runtime_sync_resilience_v3_stub


def test_sync_resilience_v3() -> None:
    p = mobile_runtime_sync_resilience_v3_stub("dev4")
    assert p["sync_resilience_score"] > 0
