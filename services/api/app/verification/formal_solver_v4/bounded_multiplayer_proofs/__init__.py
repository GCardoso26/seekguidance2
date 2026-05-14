"""Provas de legalidade multiplayer (bounded)."""

from __future__ import annotations

from typing import Any


def bounded_multiplayer_proof_stub(players: int, budget: int) -> dict[str, Any]:
    return {
        "players": players,
        "budget": budget,
        "legality_certificate": players <= budget,
        "legality_reasoning": ["Prova dentro do orçamento de interações simultâneas."],
        "proof_steps": [{"step": 1, "action": "bound_check"}],
        "assistant_notes": ["Sem CNF; apenas passos auditáveis."],
        "replay_legality_summary": "Cenário multiplayer certificado no bound declarado.",
    }
