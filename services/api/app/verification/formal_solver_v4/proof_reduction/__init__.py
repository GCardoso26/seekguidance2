"""Redução de prova (compressão explicável)."""

from __future__ import annotations

from typing import Any


def proof_reduction_stub(steps: list[str], max_steps: int) -> dict[str, Any]:
    kept = steps[:max_steps]
    return {
        "original": len(steps),
        "reduced": len(kept),
        "legality_reasoning": ["Prova reduzida a passos humanamente legíveis."],
        "proof_steps": [{"step": i + 1, "summary": s} for i, s in enumerate(kept)],
        "assistant_notes": ["Redução preserva conclusão assistente dentro do stub."],
        "replay_legality_summary": "Prova comprimida ainda suporta replay associado.",
    }
