"""canonical_runtime_summary_v2 — canonical runtime consolidation v2."""

from __future__ import annotations

import threading
from typing import Any

from app.runtime.federation_multinode.federation_multinode_runtime_v1 import (
    federation_multinode_runtime_v1,
)
from app.runtime.production_rollout_v2.production_rollout_orchestration_v2 import (
    production_rollout_engine_v2,
)
from app.runtime.runtime_consolidation.runtime_payload_normalization_v1 import (
    runtime_consolidation_engine_v1,
)

_REGISTRY: dict[str, list[str]] = {}
_HEALTH: dict[str, float] = {}
_LOCK = threading.Lock()


def canonical_runtime_consolidation_engine_v2(scope: str) -> dict[str, Any]:
    from app.runtime.external_pilot_program.external_pilot_operator_registry_v1 import (
        external_pilot_program_engine_v1,
    )
    from app.runtime.platform_ga_readiness.platform_ga_operational_summary_v1 import (
        platform_ga_readiness_engine_v1,
    )

    v1 = runtime_consolidation_engine_v1(scope)
    rollout = production_rollout_engine_v2(scope)
    fed = federation_multinode_runtime_v1(scope)
    pilot = external_pilot_program_engine_v1(scope)
    ga = platform_ga_readiness_engine_v1(scope)
    with _LOCK:
        _REGISTRY[scope] = ["execution", "federation", "observability", "governance", "persistence"]
        _HEALTH[scope] = (
            float(v1.get("consolidation_score", 0.9))
            + float(rollout.get("rollout_score", 0.9))
            + float(fed.get("cluster_score", 0.9))
        ) / 3.0
    score = (
        float(v1.get("consolidation_score", 0.9))
        + float(ga.get("ga_readiness_score", 0.9))
        + float(pilot.get("pilot_score", 0.9))
    ) / 3.0
    integrity = "ok" if score > 0.88 and ga.get("integrity_status") == "ok" else "degraded"
    return {
        "consolidation_score": round(score, 4),
        "execution_adapter": rollout,
        "federation_supervisor": fed,
        "observability_bridge": ga.get("observability_readiness", {}),
        "persistence_interface": {"default": "filesystem", "sqlite_optional": True},
        "governance_engine": pilot.get("rollout_summaries", {}),
        "runtime_registry": dict(_REGISTRY),
        "health_aggregation": dict(_HEALTH),
        "capability_negotiation": {"otlp": "optional", "k8s": "optional"},
        "canonical_routing_hints": v1.get("canonical_routing_hints", []),
        "integrity_status": integrity,
        "runtime_confidence": round(score, 4),
    }


def canonical_runtime_summary_v2_stub(
    scope: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    report = canonical_runtime_consolidation_engine_v2(scope)
    return {
        "scope": scope,
        "storage_path": storage_path or "default",
        "assistant_notes": ["canonical_runtime_consolidation_engine_v2: canonical v2."],
        "deterministic_alignment": {"token": f"canon2-{scope}"},
        "runtime_confidence": report["runtime_confidence"],
        "replay_summary": {},
        "lineage_summary": report["runtime_registry"],
        "divergence_summary": {},
        "governance_summary": report["governance_engine"],
        "lifecycle_summary": report["health_aggregation"],
        "operational_notes": report["canonical_routing_hints"],
        "integrity_status": report["integrity_status"],
        **report,
    }
