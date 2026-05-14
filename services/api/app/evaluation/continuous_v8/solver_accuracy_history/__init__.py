"""Histórico de precisão do solver."""

from __future__ import annotations

from typing import Any


def solver_accuracy_history_v8_stub(points: int = 5) -> dict[str, Any]:
    return {
        "points": points,
        "solver_stability_trends": [{"t": i, "score": 0.9} for i in range(points)],
        "assistant_notes": ["Explainability-first: sem CNF bruto nas tendências."],
    }
