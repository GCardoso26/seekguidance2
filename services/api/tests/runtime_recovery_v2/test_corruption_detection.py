"""Runtime recovery v2."""

from __future__ import annotations

from app.runtime.persistent_replay_runtime import replay_corruption_detection_v2_stub


def test_corruption_detection_v2() -> None:
    p = replay_corruption_detection_v2_stub("ref-v2")
    assert p["recovery_confidence"] > 0
    assert "corruption_summary" in p
