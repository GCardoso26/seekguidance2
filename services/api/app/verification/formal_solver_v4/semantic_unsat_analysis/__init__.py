"""UNSAT semântico (resumo explicável)."""

from __future__ import annotations

from typing import Any


def semantic_unsat_analysis_stub(topic: str) -> dict[str, Any]:
    return {
        "unsat": True,
        "topic": topic,
        "legality_reasoning": [f"Incompatibilidade semântica em «{topic}» dentro do escopo assistente."],
        "proof_steps": [{"step": 1, "action": "semantic_conflict"}],
        "assistant_notes": ["Nunca incluir cláusulas SAT; apenas narrativa verificável."],
        "replay_legality_summary": "Cenário semanticamente insatisfatível no modelo local.",
    }
