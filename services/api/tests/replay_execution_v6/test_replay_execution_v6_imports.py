"""replay_execution_v6."""
from __future__ import annotations

from app.runtime.persistent_replay_runtime.replay_execution_runtime_v3 import replay_execution_runtime_v3_stub


def test_replay_execution_v6_payload() -> None:
    p = replay_execution_runtime_v3_stub("replay-ref")
    assert p["runtime_confidence"] > 0
    assert "assistant_notes" in p
