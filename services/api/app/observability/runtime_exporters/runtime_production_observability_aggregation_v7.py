"""runtime_production_observability_aggregation_v7 — connected observability v7."""

from __future__ import annotations

import threading
from typing import Any

from app.observability.runtime_exporters.runtime_slo_aggregation_v6 import (
    runtime_connected_observability_engine_v6,
)
from app.runtime.external_pilot_program.external_pilot_operator_registry_v1 import (
    external_pilot_program_engine_v1,
)
from app.runtime.production_rollout_v2.production_rollout_orchestration_v2 import (
    production_rollout_engine_v2,
)

_METRICS: dict[str, float] = {}
_LOCK = threading.Lock()


def runtime_connected_observability_engine_v7(scope: str) -> dict[str, Any]:
    base = runtime_connected_observability_engine_v6(scope)
    pilot = external_pilot_program_engine_v1(scope)
    rollout = production_rollout_engine_v2(scope)
    with _LOCK:
        _METRICS[scope] = base.get("observability_score", 0.9)
    score = (
        _METRICS[scope]
        + float(pilot.get("pilot_score", 0.9)) * 0.1
        + float(rollout.get("rollout_score", 0.9)) * 0.1
    ) / 1.2
    integrity = base.get("integrity_status", "ok")
    return {
        "observability_score": round(score, 4),
        "distributed_tracing": {"token": f"trace-v7-{scope}"},
        "pilot_operational_metrics": {"score": pilot.get("pilot_score")},
        "production_rollout_metrics": {"score": rollout.get("rollout_score")},
        "tenant_operational_metrics": {"active": 1},
        "sla_operational_metrics": base.get("slo_aggregation", {}),
        "anomaly_summary": {"count": 0},
        "production_observability_aggregation": dict(_METRICS),
        "integrity_status": integrity,
        "runtime_confidence": round(score, 4),
    }


def runtime_production_observability_aggregation_v7_stub(
    scope: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    report = runtime_connected_observability_engine_v7(scope)
    return {
        "scope": scope,
        "storage_path": storage_path or "default",
        "assistant_notes": ["runtime_connected_observability_engine_v7: observability v7."],
        "deterministic_alignment": report["distributed_tracing"],
        "runtime_confidence": report["runtime_confidence"],
        "replay_summary": {},
        "lineage_summary": report["production_observability_aggregation"],
        "divergence_summary": report["anomaly_summary"],
        "governance_summary": report,
        "lifecycle_summary": {},
        "operational_notes": [],
        "integrity_status": report["integrity_status"],
        "observability_score": report["observability_score"],
    }
