"""Regressões cross-TCG runtime (soft)."""

from __future__ import annotations

from typing import Any


def cross_tcg_runtime_regressions_v7_stub(spread: float) -> dict[str, Any]:
    return {
        "spread": spread,
        "cross_tcg_divergence_history": [spread],
        "assistant_notes": ["Sem equivalência forte entre TCGs."],
    }
