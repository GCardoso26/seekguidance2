"""Solver de legalidade temporal."""

from __future__ import annotations

from typing import Any


def temporal_legality_solver_payload(ticks: list[int]) -> dict[str, Any]:
    return {
        "ticks": ticks,
        "legality_reasoning": ["Monotonia temporal verificada no stub."],
        "proof_steps": [{"step": 1, "action": "check_monotonicity"}],
        "assistant_notes": ["Conflitos temporais exigem lineage e replay governance."],
        "timing_certificate": len(ticks) < 2 or ticks == sorted(ticks),
    }
