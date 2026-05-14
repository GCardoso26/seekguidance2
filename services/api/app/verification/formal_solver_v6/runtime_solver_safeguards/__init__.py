"""Safeguards do solver em runtime."""

from __future__ import annotations

from typing import Any

from app.verification.formal_solver_v6._payloads import _v6_payload


def runtime_solver_safeguards_payload(emergency: bool) -> dict[str, Any]:
    return _v6_payload(
        legality_reasoning=["Safeguards preservam contratos reasoning_v*."],
        proof_steps=[{"step": 1, "emergency": emergency}],
        assistant_notes=["Degradação assistente sem hard rewrite."],
        replay_legality_summary="Runtime estável com salvaguardas ativas.",
        solver_confidence=0.5 if emergency else 0.88,
    )
