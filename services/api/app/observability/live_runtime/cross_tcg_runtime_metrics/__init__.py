"""Métricas cross-TCG em runtime."""

from __future__ import annotations

from typing import Any


def cross_tcg_runtime_metrics_stub(games: list[str]) -> dict[str, Any]:
    return {
        "games": games,
        "count": len(set(games)),
        "cross_tcg_runtime_governance_v2": True,
        "dashboard_hints": {
            "runtime": "runtime_consistency",
            "replay": "replay_integrity",
            "legality": "legality_slo",
            "ontology": "ontology_drift",
        },
        "assistant_notes": ["Comparar tendências, não legalidade literal entre TCGs distintos."],
    }
