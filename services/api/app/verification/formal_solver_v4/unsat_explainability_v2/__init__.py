"""UNSAT / contradição — explicabilidade v2 (payload rico, sem solver bruto)."""

from __future__ import annotations

from typing import Any


def unsat_explainability_v2(focus: str, hints: list[str]) -> dict[str, Any]:
    return {
        "unsat": True,
        "focus": focus,
        "hints": hints,
        "legality_reasoning": [
            f"Conflito central em «{focus}»; combinação de restrições não admite modelo dentro do escopo.",
        ],
        "proof_steps": [{"step": i + 1, "hint": h} for i, h in enumerate(hints)],
        "assistant_notes": ["Contradição é certificado assistente: o juiz valida premissas e política temporal."],
        "replay_legality_summary": "Replay associado falha coerência de legalidade nas premissas dadas.",
    }
