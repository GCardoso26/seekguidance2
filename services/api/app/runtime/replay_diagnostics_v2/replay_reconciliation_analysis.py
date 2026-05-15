"""Análise de reconciliação de replay (diagnostics v2)."""

from __future__ import annotations

from typing import Any


def replay_reconciliation_analysis_v2_stub(replay_ref: str) -> dict[str, Any]:
    return {
        "replay_ref": replay_ref,
        "reconciliation_hints": {"requires_judge": False},
        "assistant_notes": ["replay_reconciliation_analysis: explainability-first."],
    }
