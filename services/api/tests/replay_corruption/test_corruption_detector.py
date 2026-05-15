"""Replay corruption detection."""

from __future__ import annotations

from app.runtime.persistent_replay_runtime import replay_corruption_detector_stub


def test_corruption_detector() -> None:
    p = replay_corruption_detector_stub("ref-c")
    assert "corruption_summary" in p
