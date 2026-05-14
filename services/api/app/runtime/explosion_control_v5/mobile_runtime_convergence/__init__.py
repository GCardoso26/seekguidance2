"""Convergência de runtime em recursos limitados (stub)."""

from __future__ import annotations

from typing import Any


def mobile_runtime_convergence_stub(iterations: int) -> dict[str, Any]:
    return {
        "iterations": iterations,
        "converged": iterations >= 3,
        "assistant_notes": ["Convergência local heurística; solver pesado permanece opcional na cloud."],
        "replay_summary": {"steps": iterations},
        "sync_hints": ["Se não convergir, pedir assistência cloud opcional."],
        "deterministic_alignment": {"token": "mconv-v0"},
        "mobile_constraints": {"max_iterations": 6},
        "offline_confidence": 0.58,
        "lineage_replay_awareness": {"slice": "mconv-v0"},
    }
