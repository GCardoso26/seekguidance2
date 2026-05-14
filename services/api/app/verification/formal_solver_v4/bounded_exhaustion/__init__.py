"""Exaustão limitada de cenários de legalidade."""

from __future__ import annotations

from typing import Any


def bounded_exhaustive_legality_stub(*, candidates: int, budget: int) -> dict[str, Any]:
    exhausted = candidates <= budget
    return {
        "candidates": candidates,
        "budget": budget,
        "exhausted": exhausted,
        "legality_reasoning": [
            "Busca exaustiva limitada ao orçamento; resultados são certificados apenas dentro do bound.",
        ],
        "proof_steps": [{"step": 1, "action": "enumerate", "visited": min(candidates, budget)}],
        "assistant_notes": ["Parar cedo é comportamento esperado quando o orçamento é atingido."],
        "replay_legality_summary": (
            "Caminhos legais cobertos até o limite; fora do bound permanece indeterminado."
        ),
    }
