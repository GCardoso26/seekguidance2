"""Checkpoint sqlite v2."""

from __future__ import annotations

from pathlib import Path

from app.runtime.persistent_replay_runtime import sqlite_checkpoint_runtime_write


def test_checkpoint_write(tmp_path: Path) -> None:
    meta = sqlite_checkpoint_runtime_write("r1", {"step": 1}, storage_path=str(tmp_path))
    assert meta["integrity_status"]["ok"]
