"""Governança de timeouts do solver."""

from __future__ import annotations

from typing import Any

from app.verification.formal_solver_v6._payloads import _v6_payload


def solver_timeout_governance_payload(budget_ms: int, used_ms: int) -> dict[str, Any]:
    breach = used_ms > budget_ms
    return _v6_payload(
        legality_reasoning=["Timeouts como política operacional explícita."],
        proof_steps=[{"step": 1, "budget_ms": budget_ms, "used_ms": used_ms}],
        assistant_notes=["Produção distribuída: watchdogs correlacionados."],
        replay_legality_summary="Execução dentro do orçamento." if not breach else "Interrompido: revisar replay.",
        solver_confidence=0.4 if breach else 0.86,
    )
