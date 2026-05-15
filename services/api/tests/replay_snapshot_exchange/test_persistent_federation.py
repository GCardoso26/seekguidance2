"""Persistent replay federation."""

from __future__ import annotations

from app.runtime.persistent_replay_runtime import distributed_snapshot_exchange_stub


def test_distributed_snapshot_exchange() -> None:
    x = distributed_snapshot_exchange_stub("r1")
    assert x["scope"] == "r1"
