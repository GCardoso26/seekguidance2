"""APNAP formal runtime."""

from __future__ import annotations

from typing import Any

from app.verification.formal_solver_v6._payloads import _v6_payload


def apnap_formal_runtime_payload(passes: int) -> dict[str, Any]:
    return _v6_payload(
        legality_reasoning=["Passes de prioridade modelados como fila."],
        proof_steps=[{"step": 1, "passes": passes}],
        assistant_notes=["Multiplayer MTG; APNAP local."],
        replay_legality_summary="Sequência de prioridade compatível com replay.",
        solver_confidence=0.76,
    )
