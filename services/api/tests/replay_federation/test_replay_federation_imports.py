"""Replay federation stubs."""

from __future__ import annotations

from app.runtime.replay_federation import replay_runtime_consensus_stub


def test_consensus_stub() -> None:
    c = replay_runtime_consensus_stub("cluster-1")
    assert "replay_consensus_summary" in c
