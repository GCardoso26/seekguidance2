"""Replacement fixed-point v2."""

from __future__ import annotations

from typing import Any

from app.verification.formal_solver_v6._payloads import _v6_payload


def replacement_fixedpoint_runtime_v2_payload(depth: int, cap: int) -> dict[str, Any]:
    return _v6_payload(
        legality_reasoning=["Replacement recursion com profundidade limitada."],
        proof_steps=[{"step": 1, "depth": depth, "cap": cap}],
        assistant_notes=["Paradox detection: reportar loops, não esconder."],
        replay_legality_summary="Convergência parcial dentro do orçamento.",
        solver_confidence=0.75,
        contradiction_analysis=(["loop_risk"] if depth > cap else []),
    )
