"""Payload padrão v6 (explainability-first)."""

from __future__ import annotations

from typing import Any


def _v6_payload(
    *,
    legality_reasoning: list[str],
    proof_steps: list[dict[str, Any]],
    assistant_notes: list[str],
    replay_legality_summary: str,
    solver_confidence: float,
    legality_certificates: list[str] | None = None,
    contradiction_analysis: list[str] | None = None,
    timing_alignment_summary: str | None = None,
) -> dict[str, Any]:
    return {
        "legality_reasoning": legality_reasoning,
        "proof_steps": proof_steps,
        "assistant_notes": assistant_notes,
        "replay_legality_summary": replay_legality_summary,
        "solver_confidence": solver_confidence,
        "legality_certificates": legality_certificates or [],
        "contradiction_analysis": contradiction_analysis or [],
        "timing_alignment_summary": timing_alignment_summary or "n/a",
    }
