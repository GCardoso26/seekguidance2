"""runtime_infrastructure_summary_v1 — connected infrastructure."""

from __future__ import annotations

import threading
from typing import Any

from app.runtime.runtime_connected_infra.runtime_connected_infra_summary_v1 import (
    runtime_connected_infra_engine_v1,
)

_NODES: dict[str, dict[str, Any]] = {}
_LOCK = threading.Lock()


def runtime_infrastructure_engine_v1(scope: str) -> dict[str, Any]:
    infra = runtime_connected_infra_engine_v1(scope)
    with _LOCK:
        _NODES[scope] = {"role": "federation-node", "healthy": True}
    otlp = {"degraded_fallback": True, "endpoint": "optional"}
    prom = {"enabled": False, "text_export": "# TYPE runtime_up gauge\n"}
    cluster = {"nodes": len(_NODES), "scope": scope}
    score = infra.get("connected_infra_score", 0.9)
    integrity = infra.get("integrity_status", "ok")
    return {
        "infrastructure_score": round(score, 4),
        "federation_node_registry": dict(_NODES),
        "cluster_metadata": cluster,
        "otlp_exporter": otlp,
        "prometheus_exporter": prom,
        "postgres_adapter": {"optional": True, "connected": False},
        "redis_adapter": {"optional": True, "connected": False},
        "grafana_manifest": {"dashboard": f"{scope}-ops"},
        "integrity_status": integrity,
        "runtime_confidence": round(score, 4),
    }


def runtime_infrastructure_summary_v1_stub(
    scope: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    report = runtime_infrastructure_engine_v1(scope)
    return {
        "scope": scope,
        "storage_path": storage_path or "default",
        "assistant_notes": ["runtime_infrastructure_engine_v1: infrastructure."],
        "deterministic_alignment": {"token": f"infra1-{scope}"},
        "runtime_confidence": report["runtime_confidence"],
        "replay_summary": {},
        "lineage_summary": report["cluster_metadata"],
        "divergence_summary": {},
        "governance_summary": report["federation_node_registry"],
        "lifecycle_summary": {},
        "operational_notes": ["k8s_optional"],
        "integrity_status": report["integrity_status"],
        "infrastructure_score": report["infrastructure_score"],
    }
