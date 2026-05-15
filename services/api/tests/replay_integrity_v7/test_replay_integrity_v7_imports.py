"""replay_integrity_v7."""
from __future__ import annotations

from app.runtime.persistent_replay_runtime.replay_integrity_engine_v4 import replay_integrity_engine_v4_stub


def test_replay_integrity_v7_payload() -> None:
    p = replay_integrity_engine_v4_stub("ref")
    assert p["runtime_confidence"] > 0
    assert "assistant_notes" in p
