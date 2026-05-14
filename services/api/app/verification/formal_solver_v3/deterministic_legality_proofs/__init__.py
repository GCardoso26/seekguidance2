"""Provas de legalidade determinísticas (bounded)."""

from __future__ import annotations

from typing import Any

from app.verification.formal_solver.theorems import legality_theorem_stub


def legality_proof_payload(flags: dict[str, bool]) -> dict[str, Any]:
    tech = legality_theorem_stub(flags)
    return {
        "legality_reasoning": "Verificação estrutural contra flags declaradas.",
        "proof_steps": ["Compilar IR", "Verificar restrições", "Emitir certificado stub"],
        "internal": tech,
        "solver_confidence": 0.75 if tech.get("sat") else 0.35,
    }
