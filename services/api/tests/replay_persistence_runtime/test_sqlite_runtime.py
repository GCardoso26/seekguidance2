"""Persistência sqlite parcial."""
from pathlib import Path

from app.runtime.persistent_replay_runtime.sqlite_snapshot_runtime import (
    sqlite_snapshot_runtime_get,
    sqlite_snapshot_runtime_put,
)


def test_sqlite_put_get_roundtrip(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setenv("TCG_JUDGE_REPLAY_SQLITE_DIR", str(tmp_path))
    put = sqlite_snapshot_runtime_put("r1", {"k": 1})
    assert put["integrity_hash"]
    got = sqlite_snapshot_runtime_get("r1")
    assert got["found"] is True
    assert got["payload"]["k"] == 1
