"""replay_execution_runtime_v1."""
from __future__ import annotations

from app.runtime.persistent_replay_runtime.replay_execution_runtime_engine_v1 import (
    replay_execution_runtime_engine_v1_stub,
)


def test_replay_execution_runtime_v1_payload() -> None:
    p = replay_execution_runtime_engine_v1_stub("ref")
    assert p["runtime_confidence"] > 0
    assert "assistant_notes" in p
    assert "deterministic_alignment" in p
