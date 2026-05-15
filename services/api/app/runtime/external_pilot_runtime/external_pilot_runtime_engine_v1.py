"""external_pilot_runtime_engine_v1 — external pilot operational platform."""

from __future__ import annotations

import threading
from typing import Any

from app.runtime.federation_coordination.federation_runtime_coordination_engine_v1 import (
    federation_runtime_coordination_engine_v1,
)
from app.runtime.platform_completion.runtime_platform_completion_engine_v4 import (
    runtime_platform_completion_engine_v4,
)
from app.runtime.replay_certification.replay_certification_engine_v3 import replay_certification_engine_v3

_OPERATORS: dict[str, dict[str, Any]] = {}
_DRIFT: dict[str, float] = {}
_LOCK = threading.Lock()


def register_operator(operator_id: str, meta: dict[str, Any] | None = None) -> None:
    with _LOCK:
        _OPERATORS[operator_id] = meta or {"role": "pilot"}


def external_pilot_runtime_engine_v1(scope: str) -> dict[str, Any]:
    register_operator(f"op-{scope}", {"scope": scope})
    cert = replay_certification_engine_v3(f"{scope}-pilot")
    fed = federation_runtime_coordination_engine_v1(scope)
    plat = runtime_platform_completion_engine_v4(scope)
    drift = cert.get("certification_score", 0.9) - fed.get("federation_pressure", 0.0)
    with _LOCK:
        _DRIFT[scope] = round(drift, 4)
        operators = dict(_OPERATORS)
    score = (
        float(plat.get("completion_score", 0.9))
        + cert.get("runtime_confidence", 0.9)
        + fed.get("runtime_confidence", 0.9)
    ) / 3.0
    integrity = "ok" if score > 0.85 and plat.get("integrity_status") == "ok" else "degraded"
    return {
        "pilot_score": round(score, 4),
        "operator_registry": operators,
        "drift_aggregation": dict(_DRIFT),
        "federation_topology": fed.get("topology_snapshot", {}),
        "dataset_refs": [f"{scope}-pilot-ds"],
        "integrity_status": integrity,
        "runtime_confidence": round(score, 4),
    }


def external_pilot_runtime_engine_v1_stub(
    scope: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    report = external_pilot_runtime_engine_v1(scope)
    return {
        "scope": scope,
        "storage_path": storage_path or "default",
        "assistant_notes": ["external_pilot_runtime_engine_v1: external pilot platform."],
        "deterministic_alignment": {"token": f"epilot1-{scope}"},
        "runtime_confidence": report["runtime_confidence"],
        "replay_summary": report.get("dataset_refs", []),
        "lineage_summary": report.get("federation_topology", {}),
        "divergence_summary": report["drift_aggregation"],
        "governance_summary": report["operator_registry"],
        "lifecycle_summary": {"integrity": report["integrity_status"]},
        "operational_notes": ["enterprise_foundation"],
        "integrity_status": report["integrity_status"],
        **report,
    }
