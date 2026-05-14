"""Calibração juiz vs assistente."""

from __future__ import annotations

from typing import Any


def judge_calibration_scoring_stub(disagreement_rate: float) -> dict[str, Any]:
    return {
        "disagreement_rate": disagreement_rate,
        "calibration_score": max(0.0, 1.0 - disagreement_rate),
        "assistant_notes": ["Calibrar prompts e pesos, não silenciar discordância útil."],
    }
