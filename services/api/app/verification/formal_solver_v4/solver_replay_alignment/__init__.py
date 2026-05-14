"""Alinhamento solver vs replay (acordo assistente)."""

from __future__ import annotations

from typing import Any


def solver_replay_alignment_stub(solver_claim: str, replay_claim: str) -> dict[str, Any]:
    agree = solver_claim == replay_claim
    return {
        "agree": agree,
        "legality_reasoning": ["Comparação de claims resumidos (camada assistente)."],
        "proof_steps": [{"step": 1, "action": "diff_claims"}],
        "assistant_notes": ["Desacordo não implica erro humano automático."],
        "replay_legality_summary": "Solver e replay alinhados." if agree else " Requer reconciliação.",
    }
