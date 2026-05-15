"""replay_recovery_v7."""
from __future__ import annotations

from app.runtime.persistent_replay_runtime.replay_rollback_runtime_v1 import replay_rollback_runtime_v1_stub


def test_replay_recovery_v7_payload() -> None:
    p = replay_rollback_runtime_v1_stub("ref")
    assert p["runtime_confidence"] > 0
    assert "assistant_notes" in p
