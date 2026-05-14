"""Bundles explainability-first para o assistente (sem SAT ao utilizador)."""

from __future__ import annotations

from typing import Any


def formal_explainability_bundle(
    *,
    legality_reasoning: str,
    proof_steps: list[str],
    solver_confidence: float,
    contradiction_source: str | None = None,
    timing_certificate: dict[str, Any] | None = None,
    precedence_certificate: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return {
        "legality_reasoning": legality_reasoning,
        "proof_steps": proof_steps,
        "contradiction_source": contradiction_source,
        "timing_certificate": timing_certificate or {},
        "precedence_certificate": precedence_certificate or {},
        "solver_confidence": round(max(0.0, min(1.0, solver_confidence)), 4),
        "for_end_user": True,
    }
