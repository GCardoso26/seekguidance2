"""Replay recovery engine."""

from __future__ import annotations

from app.runtime.persistent_replay_runtime import replay_recovery_engine_stub


def test_recovery_engine() -> None:
    p = replay_recovery_engine_stub("ref-r")
    assert p["recovery_confidence"] > 0
    assert "recovery_summary" in p
