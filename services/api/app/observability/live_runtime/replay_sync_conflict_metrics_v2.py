"""Métricas de conflitos de sync de replay (stub)."""

from __future__ import annotations

from typing import Any


def replay_sync_conflict_metrics_v2_stub(device_id: str) -> dict[str, Any]:
    return {
        "otel_span_name": "tcg_judge.replay.sync_conflict_v2",
        "device_id_hash_stub": f"h-{device_id}",
        "assistant_notes": ["replay_sync_conflict_metrics_v2: contagem agregada apenas."],
    }
