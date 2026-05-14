"""Predição de divergência semântica."""

from __future__ import annotations

from typing import Any


def semantic_divergence_prediction_stub(spread: float) -> dict[str, Any]:
    return {
        "spread": spread,
        "divergence_prediction": spread > 0.35,
        "convergence_confidence": max(0.0, 1.0 - spread),
        "assistant_notes": ["Soft normalization: divergência não implica erro de TCG remoto."],
    }
