"""runtime_deployment_readiness_engine_v2 — deployment readiness v2."""

from __future__ import annotations

from typing import Any

from app.runtime.deployment_readiness.runtime_deployment_validation_v1 import validate_deployment
from app.runtime.pilot_runtime.pilot_runtime_operational_controller_v2 import pilot_pressure_snapshot


def deployment_readiness_v2(scope: str) -> dict[str, Any]:
    dep = validate_deployment(scope)
    pilot = pilot_pressure_snapshot(scope)
    score = (dep["deployment_score"] + pilot["readiness_score"]) / 2.0
    return {
        "scope": scope,
        "deployment_readiness_score": round(score, 4),
        "deployment": dep,
        "pilot": pilot,
    }


def runtime_deployment_readiness_engine_v2_stub(
    scope: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    report = deployment_readiness_v2(scope)
    return {
        "scope": scope,
        "storage_path": storage_path or "default",
        "assistant_notes": ["runtime_deployment_readiness_engine_v2: deployment v2."],
        "deterministic_alignment": {"token": f"depr2-{scope}"},
        "runtime_confidence": report["deployment_readiness_score"],
        "replay_summary": {},
        "lineage_summary": {},
        "divergence_summary": {"blast": report["deployment"].get("blast_radius", 0)},
        "governance_summary": report,
        "lifecycle_summary": {},
        "operational_notes": ["ready_for_controlled_prod"],
        "deployment_readiness_score": report["deployment_readiness_score"],
    }
