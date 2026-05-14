"""Convergência de replay móvel v6 (stub)."""

from __future__ import annotations

from typing import Any


def mobile_replay_convergence_v2_stub(iters: int) -> dict[str, Any]:
    return {
        "iters": iters,
        "converged": iters >= 4,
        "assistant_notes": ["Convergência local; solver pesado opcional na cloud."],
        "replay_summary": {"steps": iters},
        "deterministic_alignment": {"token": "mrcv6"},
    }
