"""Métricas agregadas do runtime móvel (stub leve)."""

from __future__ import annotations

from typing import Any


def mobile_runtime_metrics_stub(session_id: str) -> dict[str, Any]:
    return {
        "session_id": session_id,
        "replay_summary": {"ticks": 42, "chunks_loaded": 5},
        "assistant_notes": ["Métricas locais; export Prometheus/Grafana opcional na cloud."],
        "sync_hints": ["Batch 15s em Wi‑Fi; backoff em dados móveis."],
        "deterministic_alignment": {"ordering": "fifo-local"},
        "mobile_constraints": {"buffer_kb": 24},
        "offline_confidence": 0.55,
        "lineage_replay_awareness": {"slice": f"mrm-{session_id}"},
        "metrics": {"replay_miss_rate": 0.02, "sync_queue_depth": 1},
    }
