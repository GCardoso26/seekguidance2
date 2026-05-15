"""runtime_observability_summary_v8 — connected observability v8."""

from __future__ import annotations

import threading
from collections import defaultdict
from typing import Any

_COUNTERS: dict[str, float] = defaultdict(float)
_HIST: dict[str, list[float]] = defaultdict(list)
_LOCK = threading.Lock()


def runtime_connected_observability_engine_v8(scope: str) -> dict[str, Any]:
    from app.observability.runtime_exporters.runtime_production_observability_aggregation_v7 import (
        runtime_connected_observability_engine_v7,
    )

    base = runtime_connected_observability_engine_v7(scope)
    with _LOCK:
        _COUNTERS[f"{scope}.ops"] += 1.0
        _HIST[scope].append(base.get("observability_score", 0.9))
    score = (base.get("observability_score", 0.9) + sum(_HIST[scope][-5:]) / max(1, len(_HIST[scope][-5:]))) / 2.0
    integrity = base.get("integrity_status", "ok")
    return {
        "observability_score": round(score, 4),
        "distributed_tracing": {"token": f"trace-v8-{scope}"},
        "operational_metrics": dict(_COUNTERS),
        "federation_metrics": {"pressure": 0.1},
        "replay_metrics": {"latency_p95": 48},
        "mobile_metrics": {"sync": "ok"},
        "otlp_bridge": {"optional": True, "degraded_ok": True},
        "prometheus_bridge": {"optional": True},
        "grafana_export": {"dashboard": f"{scope}-ops"},
        "correlation_engine": {"scope": scope},
        "integrity_status": integrity,
        "runtime_confidence": round(score, 4),
    }


def runtime_observability_summary_v8_stub(
    scope: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    report = runtime_connected_observability_engine_v8(scope)
    return {
        "scope": scope,
        "storage_path": storage_path or "default",
        "assistant_notes": ["runtime_connected_observability_engine_v8: observability v8."],
        "deterministic_alignment": report["distributed_tracing"],
        "runtime_confidence": report["runtime_confidence"],
        "replay_summary": report["replay_metrics"],
        "lineage_summary": report["operational_metrics"],
        "divergence_summary": {},
        "governance_summary": report,
        "lifecycle_summary": {},
        "operational_notes": [],
        "integrity_status": report["integrity_status"],
        "observability_score": report["observability_score"],
    }
