"""Sync retry runtime."""

from __future__ import annotations

from app.mobile_runtime.replay_sync_retry_runtime_v2 import replay_sync_retry_runtime_v2_stub


def test_sync_retry() -> None:
    r = replay_sync_retry_runtime_v2_stub("d2")
    assert "deterministic_mobile_alignment" in r
