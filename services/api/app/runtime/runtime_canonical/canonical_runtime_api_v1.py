"""canonical_runtime_api_v1 — canonical runtime API consolidation."""

from __future__ import annotations

from typing import Any

_DOMAINS = (
    "execution",
    "replay",
    "federation",
    "observability",
    "governance",
    "persistence",
    "product",
    "certification",
)

_ALIASES: dict[str, str] = {
    "runtime_consolidation_engine_v1": "execution",
    "canonical_runtime_consolidation_engine_v2": "execution",
    "runtime_connected_observability_engine_v8": "observability",
    "production_certification_engine_v2": "certification",
}


def canonical_runtime_api_engine_v1(scope: str) -> dict[str, Any]:
    from app.runtime.runtime_consolidation.canonical_runtime_summary_v2 import (
        canonical_runtime_consolidation_engine_v2,
    )
    from app.runtime.runtime_consolidation.runtime_payload_normalization_v1 import (
        runtime_consolidation_engine_v1,
    )

    v1 = runtime_consolidation_engine_v1(scope)
    v2 = canonical_runtime_consolidation_engine_v2(scope)
    adapters = {name: {"domain": domain, "alias": True} for name, domain in _ALIASES.items()}
    deprecation = {d: {"status": "supported", "replacement": f"canonical_{d}_interface_v1"} for d in _DOMAINS}
    score = (float(v1.get("consolidation_score", 0.9)) + float(v2.get("consolidation_score", 0.9))) / 2.0
    integrity = "ok" if score > 0.88 else "degraded"
    return {
        "canonical_score": round(score, 4),
        "domains": list(_DOMAINS),
        "adapter_registry": adapters,
        "deprecation_registry": deprecation,
        "capability_mappings": v2.get("capability_negotiation", {}),
        "compatibility_layer": v1.get("canonical_routing_hints", []),
        "integrity_status": integrity,
        "runtime_confidence": round(max(0.05, score), 4),
    }


def canonical_runtime_api_v1_stub(
    scope: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    report = canonical_runtime_api_engine_v1(scope)
    return {
        "scope": scope,
        "storage_path": storage_path or "default",
        "assistant_notes": ["canonical_runtime_api_engine_v1: domain consolidation."],
        "deterministic_alignment": {"token": f"canon-api-{scope}"},
        "runtime_confidence": report["runtime_confidence"],
        "replay_summary": {},
        "lineage_summary": report["adapter_registry"],
        "divergence_summary": report["deprecation_registry"],
        "governance_summary": report,
        "lifecycle_summary": {"domains": report["domains"]},
        "operational_notes": ["adapters_only"],
        "integrity_status": report["integrity_status"],
        "canonical_score": report["canonical_score"],
    }
