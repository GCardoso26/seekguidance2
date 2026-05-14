"""Persistência de provas / certificados (formato assistente)."""

from __future__ import annotations

from typing import Any


def persist_legality_proof_stub(proof_id: str, steps: list[str]) -> dict[str, Any]:
    return {
        "proof_id": proof_id,
        "stored_steps": len(steps),
        "legality_reasoning": ["Prova comprimida em passos humanamente auditáveis."],
        "proof_steps": [{"step": i + 1, "summary": s} for i, s in enumerate(steps)],
        "assistant_notes": ["Nunca persistir CNF/SAT bruto; apenas camadas explicáveis."],
        "replay_legality_summary": f"Prova {proof_id} referenciável por replays determinísticos.",
    }
