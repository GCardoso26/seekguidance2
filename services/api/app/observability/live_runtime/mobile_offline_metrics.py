"""Métricas offline agregadas (stub)."""

from __future__ import annotations

from typing import Any


def mobile_offline_metrics_stub(queue_depth: int) -> dict[str, Any]:
    return {
        "queue_depth": queue_depth,
        "assistant_notes": ["Offline-first: profundidade de fila como sinal de risco operacional."],
        "replay_summary": {"deferred_uploads": queue_depth},
        "deterministic_alignment": {"token": "mom-v2"},
        "lineage_replay_awareness": {"slice": "mom-v2"},
    }
