"""deterministic_replay_execution_v5 imports."""

from __future__ import annotations

from app.runtime.runtime_alignment import deterministic_replay_executor_v2_stub


def test_deterministic_replay_execution_v5_payload() -> None:
    p = deterministic_replay_executor_v2_stub("replay-ref")
    assert p["runtime_confidence"] > 0
    assert "assistant_notes" in p
