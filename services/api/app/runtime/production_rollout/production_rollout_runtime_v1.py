"""production_rollout_runtime_v1 — production rollout platform."""

from __future__ import annotations

import threading
from typing import Any

from app.runtime.external_pilot_runtime.external_pilot_runtime_engine_v1 import (
    external_pilot_runtime_engine_v1,
)
from app.runtime.platform_completion.runtime_platform_completion_engine_v4 import (
    runtime_platform_completion_engine_v4,
)

_OPERATORS: dict[str, dict[str, Any]] = {}
_TENANTS: dict[str, dict[str, Any]] = {}
_USAGE: dict[str, int] = {}
_LOCK = threading.Lock()


def production_rollout_engine_v1(scope: str) -> dict[str, Any]:
    pilot = external_pilot_runtime_engine_v1(scope)
    plat = runtime_platform_completion_engine_v4(scope)
    env = {"name": "production", "region": "primary", "tier": "enterprise"}
    with _LOCK:
        _OPERATORS[scope] = {"role": "production-operator", "scope": scope}
        _TENANTS[scope] = {"tier": "production", "onboarded": True}
        _USAGE[scope] = _USAGE.get(scope, 0) + 1
        usage = dict(_USAGE)
    score = (
        float(pilot.get("pilot_score", 0.9))
        + float(plat.get("completion_score", 0.9))
    ) / 2.0
    safety = score > 0.88 and pilot.get("integrity_status") == "ok"
    integrity = "ok" if safety else "review"
    return {
        "rollout_score": round(score, 4),
        "operator_registry": dict(_OPERATORS),
        "tenant_registry": dict(_TENANTS),
        "environment_metadata": env,
        "usage_counters": usage,
        "rollout_safety_summary": {"safe": safety, "score": round(score, 4)},
        "integrity_status": integrity,
        "runtime_confidence": round(score, 4),
    }


def production_rollout_runtime_v1_stub(
    scope: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    report = production_rollout_engine_v1(scope)
    return {
        "scope": scope,
        "storage_path": storage_path or "default",
        "assistant_notes": ["production_rollout_engine_v1: production rollout."],
        "deterministic_alignment": {"token": f"proll1-{scope}"},
        "runtime_confidence": report["runtime_confidence"],
        "replay_summary": {},
        "lineage_summary": report["environment_metadata"],
        "divergence_summary": {},
        "governance_summary": report["rollout_safety_summary"],
        "lifecycle_summary": {"tenants": len(report["tenant_registry"])},
        "operational_notes": ["production_grade_rollout"],
        "integrity_status": report["integrity_status"],
        **report,
    }
