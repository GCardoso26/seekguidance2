"""SQLite adapter real."""

from __future__ import annotations

from app.runtime.persistent_replay_runtime import sqlite_replay_runtime_adapter_put


def test_sqlite_adapter_put(tmp_path) -> None:
    meta = sqlite_replay_runtime_adapter_put("ref-adapt", {"k": 1}, root=tmp_path)
    assert meta["adapter"] == "sqlite"
