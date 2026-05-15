"""Runtime consistency v2."""

from __future__ import annotations

from app.runtime.runtime_alignment import replay_consistency_scoring_v2_stub


def test_consistency_scoring_v2() -> None:
    p = replay_consistency_scoring_v2_stub("c1")
    assert p["consistency_score"] > 0
    assert p["runtime_confidence"] > 0
