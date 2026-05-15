"""Métricas de recuperação de replay distribuída (stub)."""

from __future__ import annotations

from typing import Any


def replay_recovery_distributed_metrics_stub(scope: str) -> dict[str, Any]:
    return {
        "metric_family": "tcg_judge_replay_recovery_distributed",
        "scope": scope,
        "assistant_notes": ["replay_recovery_distributed_metrics: checkpoints determinísticos."],
    }
