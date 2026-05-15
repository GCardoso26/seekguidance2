"""runtime_infrastructure_health_aggregation_v2 — connected infrastructure v2."""

from __future__ import annotations

from typing import Any

from app.runtime.runtime_infrastructure.runtime_infrastructure_summary_v1 import (
    runtime_infrastructure_engine_v1,
)


def runtime_connected_infrastructure_engine_v2(scope: str) -> dict[str, Any]:
    base = runtime_infrastructure_engine_v1(scope)
    otlp = {"ready": True, "degraded_fallback": base.get("otlp_exporter", {}).get("degraded_fallback")}
    prom = {"scrape_ready": False, "optional": True}
    fed_health = len(base.get("federation_node_registry", {}))
    failover = max(0.0, 1.0 - fed_health * 0.01)
    score = (base.get("infrastructure_score", 0.9) + failover) / 2.0
    integrity = base.get("integrity_status", "ok")
    return {
        "infrastructure_score": round(score, 4),
        "connector_summaries": {"otlp": otlp, "prometheus": prom},
        "federation_infra_health": {"nodes": fed_health},
        "tracing_readiness": {"token": f"tr-infra2-{scope}"},
        "persistence_readiness": {
            "postgres": base.get("postgres_adapter", {}),
            "redis": base.get("redis_adapter", {}),
        },
        "infra_degradation_summary": {"degraded": integrity != "ok"},
        "failover_scoring": round(failover, 4),
        "grafana_registry": base.get("grafana_manifest", {}),
        "integrity_status": integrity,
        "runtime_confidence": round(score, 4),
    }


def runtime_infrastructure_health_aggregation_v2_stub(
    scope: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    report = runtime_connected_infrastructure_engine_v2(scope)
    return {
        "scope": scope,
        "storage_path": storage_path or "default",
        "assistant_notes": ["runtime_connected_infrastructure_engine_v2: infra v2."],
        "deterministic_alignment": report["tracing_readiness"],
        "runtime_confidence": report["runtime_confidence"],
        "replay_summary": {},
        "lineage_summary": report["persistence_readiness"],
        "divergence_summary": report["infra_degradation_summary"],
        "governance_summary": report["connector_summaries"],
        "lifecycle_summary": {},
        "operational_notes": [],
        "integrity_status": report["integrity_status"],
        "infrastructure_score": report["infrastructure_score"],
    }
