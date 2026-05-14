"""Calibração cross-TCG (soft, sem equivalência forte)."""

from __future__ import annotations

from typing import Any


def cross_tcg_validation_stub(game_a: str, game_b: str, spread: float) -> dict[str, Any]:
    return {
        "pair": (game_a, game_b),
        "spread": spread,
        "calibration_score": max(0.0, 1.0 - spread),
        "assistant_notes": ["Métricas comparativas apenas; legalidade não é transportada entre TCGs."],
    }
