"""replay_persistence_v5 imports."""

from __future__ import annotations

from app.runtime.persistent_replay_runtime import replay_snapshot_sqlite_runtime_v2_stub


def test_replay_persistence_v5_payload() -> None:
    p = replay_snapshot_sqlite_runtime_v2_stub("ref")
    assert p["runtime_confidence"] > 0
    assert "assistant_notes" in p
