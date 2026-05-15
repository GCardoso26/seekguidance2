"""Mobile resilience v3."""

from __future__ import annotations

from app.mobile_runtime.mobile_runtime_resilience import mobile_runtime_resilience_stub


def test_mobile_resilience_payload() -> None:
    r = mobile_runtime_resilience_stub("d1")
    assert "sync_recovery_hints" in r
    assert "replay_delta_integrity" in r
