"""Bridges de storage replay."""

from __future__ import annotations

from app.runtime.persistent_replay_runtime import replay_storage_sqlite_bridge_stub


def test_sqlite_bridge() -> None:
    b = replay_storage_sqlite_bridge_stub("r1")
    assert b["dialect"] == "sqlite"
