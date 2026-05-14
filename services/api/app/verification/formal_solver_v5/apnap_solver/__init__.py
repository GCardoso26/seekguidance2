"""Solver APNAP (multiplayer MTG, assistente)."""

from __future__ import annotations

from typing import Any


def apnap_solver_payload(active_player: str, n_priority_passes: int) -> dict[str, Any]:
    return {
        "active_player": active_player,
        "n_priority_passes": n_priority_passes,
        "legality_reasoning": ["Prioridade relativa modelada como fila de passes."],
        "proof_steps": [{"step": 1, "action": "enqueue_passes"}],
        "assistant_notes": ["APNAP é semântica MTG; não exportar como regra universal."],
        "solver_confidence": 0.76,
    }
