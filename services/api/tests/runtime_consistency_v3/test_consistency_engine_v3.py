"""Consistency engine v3."""

from __future__ import annotations

from app.runtime.runtime_alignment import runtime_consistency_engine_v3_stub


def test_consistency_engine_v3() -> None:
    p = runtime_consistency_engine_v3_stub("c3")
    assert p["consistency_score"] > 0
    assert p["alignment_summary"] is not None
