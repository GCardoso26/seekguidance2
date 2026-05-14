"""Alinhamento determinístico solver."""

from __future__ import annotations

from typing import Any

from app.verification.formal_solver_v6._payloads import _v6_payload


def deterministic_solver_alignment_v6_payload(h1: str, h2: str) -> dict[str, Any]:
    match = h1 == h2
    return _v6_payload(
        legality_reasoning=["Comparação de hashes de estado resumido."],
        proof_steps=[{"step": 1, "match": match}],
        assistant_notes=["Operational explainability."],
        replay_legality_summary="Determinismo consistente." if match else "Divergência.",
        solver_confidence=0.95 if match else 0.45,
        timing_alignment_summary="hash_match" if match else "hash_mismatch",
    )
