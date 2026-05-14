"""SEGOC runtime validation."""

from __future__ import annotations

from typing import Any

from app.verification.formal_solver_v6._payloads import _v6_payload


def segoc_runtime_validation_payload(mandatory_first: bool) -> dict[str, Any]:
    return _v6_payload(
        legality_reasoning=["SEGOC competitivo como ordenação explícita."],
        proof_steps=[{"step": 1, "mandatory_first": mandatory_first}],
        assistant_notes=["Yu-Gi-Oh! documentação oficial prevalece."],
        replay_legality_summary="Ordem SEGOC consistente com flags.",
        solver_confidence=0.84,
    )
