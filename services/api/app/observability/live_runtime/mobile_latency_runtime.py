"""Latência percebida no cliente móvel (stub)."""

from __future__ import annotations

from typing import Any


def mobile_latency_runtime_stub(p50_ms: float) -> dict[str, Any]:
    return {
        "p50_ms": p50_ms,
        "replay_summary": {"ui_frame_budget_ms": 12},
        "assistant_notes": ["Latência UI separada da latência de ruling/solver."],
        "sync_hints": ["Prefetch de próximo chunk em idle."],
        "deterministic_alignment": {"clock_sync": "best_effort_local"},
        "mobile_constraints": {"target_p95_ms": 180},
        "offline_confidence": 0.51,
        "lineage_replay_awareness": {"slice": "mlr-v0"},
    }
