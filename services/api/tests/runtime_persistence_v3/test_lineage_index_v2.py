"""Persistence v3 lineage index."""

from __future__ import annotations

from pathlib import Path

from app.runtime.persistent_replay_runtime import sqlite_runtime_lineage_index_v2_upsert


def test_lineage_index_upsert(tmp_path: Path) -> None:
    meta = sqlite_runtime_lineage_index_v2_upsert("lin-1", "ref-1", {}, storage_path=str(tmp_path))
    assert meta["integrity_status"]["ok"]
