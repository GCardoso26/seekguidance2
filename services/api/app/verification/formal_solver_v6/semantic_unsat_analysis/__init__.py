"""UNSAT semântico (v6)."""

from __future__ import annotations

from typing import Any

from app.verification.formal_solver_v6._payloads import _v6_payload


def semantic_unsat_analysis_v6_payload(topic: str) -> dict[str, Any]:
    return _v6_payload(
        legality_reasoning=[f"UNSAT semântico em «{topic}» no escopo local."],
        proof_steps=[{"step": 1, "unsat": True}],
        assistant_notes=["Contradiction analysis assistente."],
        replay_legality_summary="Cenário insatisfatível com premissas dadas.",
        solver_confidence=0.6,
        contradiction_analysis=[topic],
    )
