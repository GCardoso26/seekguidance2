"""Checkpoint stub."""

from __future__ import annotations

from app.runtime.persistent_replay_runtime import replay_temporal_checkpointing_stub


def test_temporal_checkpoint() -> None:
    p = replay_temporal_checkpointing_stub("ref-t")
    assert p["integrity_status"]["ok"]
