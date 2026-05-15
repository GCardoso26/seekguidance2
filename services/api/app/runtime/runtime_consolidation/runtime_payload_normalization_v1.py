"""runtime_payload_normalization_v1 — runtime consolidation layer."""

from __future__ import annotations

from typing import Any

from app.runtime.production_rollout.production_rollout_runtime_v1 import production_rollout_engine_v1
from app.runtime.production_rollout_v2.production_rollout_orchestration_v2 import (
    production_rollout_engine_v2,
)

_REQUIRED = (
    "assistant_notes",
    "deterministic_alignment",
    "runtime_confidence",
    "divergence_summary",
    "governance_summary",
    "lifecycle_summary",
    "operational_notes",
    "integrity_status",
)

_REGISTRY: dict[str, list[str]] = {
    "execution": ["production_rollout_v1", "production_rollout_v2"],
    "federation": ["federation_multinode", "federation_coordination"],
    "observability": ["connected_observability_v5", "connected_observability_v6"],
    "governance": ["execution_governance_v2", "platform_ga"],
}


def runtime_consolidation_engine_v1(scope: str) -> dict[str, Any]:
    from app.runtime.external_pilot_program.external_pilot_operator_registry_v1 import (
        external_pilot_program_engine_v1,
    )
    from app.runtime.platform_ga_readiness.platform_ga_operational_summary_v1 import (
        platform_ga_readiness_engine_v1,
    )

    v1 = production_rollout_engine_v1(scope)
    v2 = production_rollout_engine_v2(scope)
    pilot = external_pilot_program_engine_v1(scope)
    ga = platform_ga_readiness_engine_v1(scope)
    normalized = {
        k: v1.get(k, v2.get(k, pilot.get(k, ga.get(k))))
        for k in _REQUIRED
    }
    score = (
        float(v1.get("rollout_score", 0.9))
        + float(v2.get("rollout_score", 0.9))
        + float(pilot.get("pilot_score", 0.9))
        + float(ga.get("ga_readiness_score", 0.9))
    ) / 4.0
    integrity = "ok" if all(normalized.get(k) for k in _REQUIRED) else "degraded"
    return {
        "consolidation_score": round(score, 4),
        "consolidated_runtime_summaries": {"v1": v1, "v2": v2, "pilot": pilot, "ga": ga},
        "compatibility_summaries": _REGISTRY,
        "capability_summaries": {"engines": len(_REGISTRY)},
        "canonical_routing_hints": ["use_v2_when_available", "fallback_v1"],
        "execution_normalization": {"rollout_v2": v2.get("rollout_state")},
        "scoring_normalization": {"score": round(score, 4)},
        "payload_normalization": normalized,
        "integrity_status": integrity,
        "runtime_confidence": round(score, 4),
    }


def runtime_payload_normalization_v1_stub(
    scope: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    report = runtime_consolidation_engine_v1(scope)
    return {
        "scope": scope,
        "storage_path": storage_path or "default",
        "assistant_notes": ["runtime_consolidation_engine_v1: canonical aggregation layer."],
        "deterministic_alignment": {"token": f"consol1-{scope}"},
        "runtime_confidence": report["runtime_confidence"],
        "replay_summary": {},
        "lineage_summary": report["compatibility_summaries"],
        "divergence_summary": {},
        "governance_summary": report["consolidated_runtime_summaries"],
        "lifecycle_summary": {},
        "operational_notes": report["canonical_routing_hints"],
        "integrity_status": report["integrity_status"],
        "consolidation_score": report["consolidation_score"],
    }
