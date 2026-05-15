"""Persistência SQLite / filesystem leve."""

from __future__ import annotations

from pathlib import Path

from app.runtime.persistent_replay_runtime import (
    filesystem_archive_read_latest,
    filesystem_archive_write,
    sqlite_read_latest_snapshot,
    sqlite_write_snapshot,
)


def test_sqlite_roundtrip(tmp_path: Path) -> None:
    meta = sqlite_write_snapshot("ref-x", {"k": 1}, root=tmp_path)
    assert meta["integrity_hash"]
    got = sqlite_read_latest_snapshot("ref-x", root=tmp_path)
    assert got is not None
    assert got["integrity_ok"] is True


def test_filesystem_archive_roundtrip(tmp_path: Path) -> None:
    w = filesystem_archive_write("ref-y", {"a": 2}, root=tmp_path)
    assert w["version"] == 1
    r = filesystem_archive_read_latest("ref-y", root=tmp_path)
    assert r is not None
    assert r["snapshot"]["a"] == 2
