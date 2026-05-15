"""external_pilot_operator_registry_v1 — external pilot program."""

from __future__ import annotations

import threading
from typing import Any

from app.runtime.external_pilot_runtime.external_pilot_runtime_engine_v1 import external_pilot_runtime_engine_v1
from app.runtime.production_rollout_v2.production_rollout_orchestration_v2 import production_rollout_engine_v2

_OPERATORS: dict[str, dict[str, Any]] = {}
_TENANTS: dict[str, dict[str, Any]] = {}
_WORKLOADS: dict[str, int] = {}
_LOCK = threading.Lock()


def external_pilot_program_engine_v1(scope: str) -> dict[str, Any]:
    from app.runtime.platform_ga_readiness.platform_ga_operational_summary_v1 import (
        platform_ga_readiness_engine_v1,
    )

    pilot = external_pilot_runtime_engine_v1(scope)
    rollout = production_rollout_engine_v2(scope)
    ga = platform_ga_readiness_engine_v1(scope)
    with _LOCK:
        _OPERATORS[scope] = {"role": "pilot-operator", "active": True}
        _TENANTS[scope] = {"tier": "controlled-pilot", "isolated": True}
        _WORKLOADS[scope] = _WORKLOADS.get(scope, 0) + 1
    score = (
        float(pilot.get("pilot_score", 0.9))
        + float(rollout.get("rollout_score", 0.9))
        + float(ga.get("ga_readiness_score", 0.9))
    ) / 3.0
    integrity = "ok" if score > 0.88 and ga.get("integrity_status") == "ok" else "degraded"
    return {
        "pilot_score": round(score, 4),
        "operator_summaries": dict(_OPERATORS),
        "tenant_summaries": dict(_TENANTS),
        "workload_summaries": dict(_WORKLOADS),
        "rollout_summaries": rollout,
        "drift_summaries": pilot.get("drift_aggregation", {}),
        "federation_topology": pilot.get("federation_topology", {}),
        "pilot_runtime_confidence": round(score, 4),
        "integrity_status": integrity,
        "runtime_confidence": round(score, 4),
    }


def external_pilot_operator_registry_v1_stub(
    scope: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    report = external_pilot_program_engine_v1(scope)
    return {
        "scope": scope,
        "storage_path": storage_path or "default",
        "assistant_notes": ["external_pilot_program_engine_v1: controlled pilot program."],
        "deterministic_alignment": {"token": f"epprog1-{scope}"},
        "runtime_confidence": report["runtime_confidence"],
        "replay_summary": report.get("workload_summaries", {}),
        "lineage_summary": report.get("federation_topology", {}),
        "divergence_summary": report.get("drift_summaries", {}),
        "governance_summary": report.get("rollout_summaries", {}),
        "lifecycle_summary": {"operators": len(report["operator_summaries"])},
        "operational_notes": ["controlled_external_pilot"],
        "integrity_status": report["integrity_status"],
        **report,
    }
