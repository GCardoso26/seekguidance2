"""Métricas de storage móvel (stub)."""

from __future__ import annotations

from typing import Any


def mobile_storage_metrics_stub(db_mb: float) -> dict[str, Any]:
    return {
        "db_mb": db_mb,
        "assistant_notes": ["Métricas agregadas; sem caminhos completos de ficheiros."],
        "replay_summary": {"wal_ratio": 0.12},
        "deterministic_alignment": {"token": "msm-v2"},
        "lineage_replay_awareness": {"slice": "msm-v2"},
    }
