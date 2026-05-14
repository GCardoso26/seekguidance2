"""Expectativas de legalidade formal (bounded, explicável)."""

from __future__ import annotations

from typing import Any


def formal_legality_expectation_stub(case_id: str, ok: bool) -> dict[str, Any]:
    return {
        "case_id": case_id,
        "passed": ok,
        "legality_reasoning": ["Verificação assistente contra manifest; sem CNF exposto."],
        "proof_steps": [{"step": 1, "action": "check_expectation", "detail": case_id}],
    }
