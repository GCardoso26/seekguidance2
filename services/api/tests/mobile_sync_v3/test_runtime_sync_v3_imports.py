"""Sync móvel v3."""

from __future__ import annotations

from app.mobile_runtime.runtime_sync_v2 import replay_delta_queue_v3_stub


def test_replay_delta_queue() -> None:
    q = replay_delta_queue_v3_stub("d1")
    assert isinstance(q, dict)
