"""Alignment v2."""

from __future__ import annotations

from app.runtime.runtime_alignment import federation_runtime_alignment_v2_stub


def test_federation_alignment_v2() -> None:
    p = federation_runtime_alignment_v2_stub("fed-1")
    assert p["alignment_score"] > 0
