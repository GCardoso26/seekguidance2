"""Lineage runtime."""

from __future__ import annotations

from app.runtime.persistent_replay_runtime.replay_lineage_service import replay_lineage_service_stub


def test_replay_lineage_service() -> None:
    r = replay_lineage_service_stub("l1")
    assert isinstance(r, dict)
