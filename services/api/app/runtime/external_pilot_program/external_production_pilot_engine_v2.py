"""external_production_pilot_engine_v2 — external production pilot v2."""

from __future__ import annotations

from typing import Any

from app.runtime.external_pilot_program.external_pilot_operator_registry_v1 import (
    external_pilot_program_engine_v1,
)
from app.runtime.production_certification.runtime_production_certification_summary_v2 import (
    production_certification_engine_v2,
)
from app.runtime.production_rollout_v2.production_rollout_orchestration_v2 import (
    production_rollout_engine_v2,
)
from app.runtime.runtime_consolidation.canonical_runtime_summary_v2 import (
    canonical_runtime_consolidation_engine_v2,
)
from app.runtime.runtime_governance.runtime_governance_operational_summary_v2 import (
    runtime_operational_governance_engine_v2,
)


def external_production_pilot_engine_v2(scope: str) -> dict[str, Any]:
    pilot = external_pilot_program_engine_v1(scope)
    rollout = production_rollout_engine_v2(scope)
    cert = production_certification_engine_v2(scope)
    gov = runtime_operational_governance_engine_v2(scope)
    canon = canonical_runtime_consolidation_engine_v2(scope)
    blast = rollout.get("blast_radius_score", 0.0)
    score = (
        float(pilot.get("pilot_score", 0.9))
        + float(cert.get("certification_score", 0.9))
        + float(gov.get("governance_score", 0.9))
        + float(canon.get("consolidation_score", 0.9))
    ) / 4.0 - blast * 0.1
    integrity = "ok" if score > 0.88 and blast < 0.7 else "degraded"
    return {
        "pilot_score": round(max(0.05, score), 4),
        "operator_runtime": pilot.get("operator_summaries", {}),
        "tenant_runtime": pilot.get("tenant_summaries", {}),
        "rollout_safety": rollout.get("rollout_safety_summary", rollout.get("health_aggregation", {})),
        "blast_radius_control": {"score": blast, "limited": blast < 0.7},
        "certification_validation": cert,
        "governance_runtime": gov,
        "reliability_runtime": cert.get("ha_validation", {}),
        "integrity_status": integrity,
        "runtime_confidence": round(max(0.05, score), 4),
    }


def external_production_pilot_engine_v2_stub(
    scope: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    report = external_production_pilot_engine_v2(scope)
    return {
        "scope": scope,
        "storage_path": storage_path or "default",
        "assistant_notes": ["external_production_pilot_engine_v2: production pilot v2."],
        "deterministic_alignment": {"token": f"eppilot2-{scope}"},
        "runtime_confidence": report["runtime_confidence"],
        "replay_summary": report.get("certification_validation", {}),
        "lineage_summary": report.get("blast_radius_control", {}),
        "divergence_summary": pilot_drift if (pilot_drift := report.get("blast_radius_control")) else {},
        "governance_summary": report.get("governance_runtime", {}),
        "lifecycle_summary": {},
        "operational_notes": ["external_production_pilot"],
        "integrity_status": report["integrity_status"],
        **report,
    }
