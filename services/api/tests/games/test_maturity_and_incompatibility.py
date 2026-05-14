"""Maturidade multi-TCG + incompatibilidade semântica."""

from __future__ import annotations

from app.games.normalization.reasoning_maturity_matrix import maturity_summary
from app.games.normalization.semantic_incompatibility import semantic_incompatibility_report


def test_maturity_summary_mtg() -> None:
    s = maturity_summary("mtg")
    assert s["average"] > 0


def test_incompatibility_mtg_ygo() -> None:
    r = semantic_incompatibility_report("mtg", "yugioh")
    assert "incompatible" in r
