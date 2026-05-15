"""Runtime consistency engine."""

from __future__ import annotations

from app.runtime.runtime_alignment import runtime_consistency_engine_stub


def test_consistency_payload() -> None:
    p = runtime_consistency_engine_stub("s1")
    assert p["replay_consistency_score"] > 0
    assert "consistency_summary" in p
