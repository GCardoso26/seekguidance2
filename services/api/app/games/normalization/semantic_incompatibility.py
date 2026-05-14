"""Incompatibilidade semântica explícita entre modelos de jogo."""

from __future__ import annotations

from typing import Any

from app.games.normalization.gameplay_maturity import gameplay_equivalence_confidence, timing_model_divergence


def semantic_incompatibility_report(a_game: str, b_game: str) -> dict[str, Any]:
    div = timing_model_divergence(a_game, b_game)
    conf = gameplay_equivalence_confidence(a_game, b_game, "stack")
    incompatible = conf < 0.5 or div.get("stack_vs_chain") is True
    return {"incompatible": incompatible, "equivalence_confidence": conf, "timing_divergence": div}


def resource_system_divergence(a_game: str, b_game: str) -> dict[str, Any]:
    """Mana vs Life vs Memory — descritores textuais apenas."""
    return {"a": a_game, "b": b_game, "note": "resource_axis_descriptor_stub"}
