"""Provas de legalidade temporal."""

from __future__ import annotations

from typing import Any

from app.verification.formal_solver_v6._payloads import _v6_payload


def temporal_legality_proofs_payload(ticks: list[int]) -> dict[str, Any]:
    mono = ticks == sorted(ticks) if ticks else True
    return _v6_payload(
        legality_reasoning=["Provas de monotonia temporal no replay."],
        proof_steps=[{"step": 1, "action": "check_ticks", "count": len(ticks)}],
        assistant_notes=["Simultaneous timing: documentar trade-offs por TCG."],
        replay_legality_summary="Temporal coerente." if mono else "Inconsistência temporal candidata.",
        solver_confidence=0.82 if mono else 0.5,
        timing_alignment_summary="monotonic" if mono else "non_monotonic",
    )
