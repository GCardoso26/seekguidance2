"""Legalidade operacional (runtime assistente)."""

from __future__ import annotations

from typing import Any

from app.verification.formal_solver_v6._payloads import _v6_payload


def operational_legality_runtime_payload(case_id: str) -> dict[str, Any]:
    return _v6_payload(
        legality_reasoning=[f"Caso «{case_id}» avaliado em modo assistente operacional."],
        proof_steps=[{"step": 1, "action": "bind_case", "id": case_id}],
        assistant_notes=["Sem CNF/SAT bruto; certificados resumidos apenas."],
        replay_legality_summary="Replay coerente com premissas declaradas no stub.",
        solver_confidence=0.8,
        legality_certificates=["stub_cert"],
    )
