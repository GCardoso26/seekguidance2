"""Maturidade de gameplay cross-TCG (divergências de modelo, não equivalência mecânica)."""

from __future__ import annotations

from typing import Any


def timing_model_divergence(a_game: str, b_game: str) -> dict[str, Any]:
    return {
        "a": a_game,
        "b": b_game,
        "stack_vs_chain": a_game in {"mtg"} and b_game in {"yugioh"},
        "note": "divergence_descriptor_only",
    }


def gameplay_equivalence_confidence(from_game: str, to_game: str, subsystem: str) -> float:
    """0–1 heurístico; 1.0 nunca deve ser assumido como identidade formal."""
    if from_game == to_game:
        return 1.0
    if subsystem in {"stack", "chain", "priority"}:
        return 0.35
    return 0.2
