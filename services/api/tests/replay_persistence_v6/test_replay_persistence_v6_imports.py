"""replay_persistence_v6."""
from __future__ import annotations

from app.runtime.persistent_replay_runtime.sqlite_replay_execution_store_v2 import sqlite_replay_execution_store_v2_stub


def test_replay_persistence_v6_payload() -> None:
    p = sqlite_replay_execution_store_v2_stub("ref")
    assert p["runtime_confidence"] > 0
    assert "assistant_notes" in p
