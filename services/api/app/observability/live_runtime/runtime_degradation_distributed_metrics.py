"""Métricas de degradação runtime distribuída (stub)."""

from __future__ import annotations

from typing import Any


def runtime_degradation_distributed_metrics_stub(scope: str) -> dict[str, Any]:
    return {
        "metric_family": "tcg_judge_runtime_degradation_distributed",
        "scope": scope,
        "assistant_notes": ["runtime_degradation_distributed_metrics: sinais agregados."],
    }
