"""Hardening cross-TCG v7 (sem equivalência forte)."""

from __future__ import annotations

from app.games.hardening_v7 import yugioh_segoc_instability_v7_stub


def test_yugioh_segoc_stub() -> None:
    r = yugioh_segoc_instability_v7_stub("y1")
    assert isinstance(r, dict)
