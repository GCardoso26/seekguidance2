"""Storage integrity v2."""

from __future__ import annotations

from pathlib import Path

from app.runtime.persistent_replay_runtime import sqlite_runtime_integrity_store_v2_put


def test_integrity_store_put(tmp_path: Path) -> None:
    meta = sqlite_runtime_integrity_store_v2_put("ref-i", {"k": 1}, storage_path=str(tmp_path))
    assert meta["integrity_hash"]
