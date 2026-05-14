"""Consistência solver↔replay."""

from __future__ import annotations

from typing import Any

from app.verification.formal_solver_v6._payloads import _v6_payload


def solver_replay_consistency_payload(s: str, r: str) -> dict[str, Any]:
    agree = s == r
    return _v6_payload(
        legality_reasoning=["Comparação de resumos verificáveis."],
        proof_steps=[{"step": 1, "agree": agree}],
        assistant_notes=["Desacordo aciona replay governance v2."],
        replay_legality_summary="Solver e replay alinhados." if agree else "Divergência documentada.",
        solver_confidence=0.9 if agree else 0.55,
    )
