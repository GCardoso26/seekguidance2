"""replay_sandbox_v7."""
from __future__ import annotations

from app.runtime.replay_sandbox.replay_sandbox_runtime_v1 import replay_sandbox_runtime_v1_stub


def test_replay_sandbox_v7_payload() -> None:
    p = replay_sandbox_runtime_v1_stub("scope")
    assert p["runtime_confidence"] > 0
    assert "assistant_notes" in p
