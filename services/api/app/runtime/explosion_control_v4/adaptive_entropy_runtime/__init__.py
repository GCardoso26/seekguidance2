"""Entropia adaptativa em runtime (previsão assistente)."""

from __future__ import annotations

from typing import Any


def adaptive_entropy_runtime_stub(branching_factor: float) -> dict[str, Any]:
    risk = min(1.0, branching_factor / 32.0)
    return {
        "branching_factor": branching_factor,
        "risk_score": risk,
        "assistant_notes": ["Explosion control: ajustar caps antes de expandir busca simbólica."],
        "degrade_hint": risk > 0.6,
    }
