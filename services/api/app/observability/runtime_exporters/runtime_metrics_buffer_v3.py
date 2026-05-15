"""Buffer de métricas in-memory (stdlib)."""

from __future__ import annotations

import threading
from typing import Any

_COUNTERS: dict[str, float] = {}
_LOCK = threading.Lock()


def record_runtime_metric(name: str, value: float = 1.0) -> None:
    with _LOCK:
        _COUNTERS[name] = _COUNTERS.get(name, 0.0) + value


def metrics_buffer_snapshot() -> dict[str, float]:
    with _LOCK:
        return dict(_COUNTERS)


def runtime_metrics_buffer_v3_stub(scope: str, *, storage_path: str | None = None) -> dict[str, Any]:
    record_runtime_metric(f"scope.{scope}")
    snap = metrics_buffer_snapshot()
    return {
        "scope": scope,
        "storage_path": storage_path or "memory",
        "assistant_notes": ["runtime_metrics_buffer_v3: métricas in-memory."],
        "deterministic_alignment": {"token": f"met-{scope}"},
        "runtime_confidence": 0.85,
        "replay_summary": {},
        "lineage_summary": {},
        "divergence_summary": {},
        "operational_notes": [],
        "metrics_summary": snap,
        "trace_correlation_score": 0.85,
    }
