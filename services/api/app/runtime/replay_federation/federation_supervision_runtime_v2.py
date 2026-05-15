"""federation_supervision_runtime_v2 — registry, health, drift."""

from __future__ import annotations

import threading
import time
from typing import Any

_NODES: dict[str, dict[str, Any]] = {}
_LOCK = threading.Lock()


def register_node(node_id: str, *, region: str = "default", health: float = 1.0) -> None:
    with _LOCK:
        _NODES[node_id] = {
            "node_id": node_id,
            "region": region,
            "health": max(0.0, min(1.0, health)),
            "registered_at": time.time(),
        }


def federation_health_aggregate(scope: str) -> dict[str, Any]:
    with _LOCK:
        nodes = list(_NODES.values())
    if not nodes:
        register_node(f"{scope}-primary", health=0.92)
        nodes = list(_NODES.values())
    avg = sum(n["health"] for n in nodes) / len(nodes)
    degraded = [n["node_id"] for n in nodes if n["health"] < 0.7]
    return {
        "scope": scope,
        "node_count": len(nodes),
        "avg_health": round(avg, 4),
        "degraded_nodes": degraded,
        "topology_summary": {"regions": sorted({n["region"] for n in nodes})},
        "drift_summary": {"sync_mismatch_hints": degraded},
        "rollout_safety_score": avg,
    }


def federation_supervision_runtime_v2_stub(scope: str, *, storage_path: str | None = None) -> dict[str, Any]:
    agg = federation_health_aggregate(scope)
    return {
        "scope": scope,
        "storage_path": storage_path or "default",
        "assistant_notes": ["federation_supervision_runtime_v2: supervision v10."],
        "deterministic_alignment": {"token": f"fed2-{scope}"},
        "runtime_confidence": agg["avg_health"],
        "replay_summary": {},
        "lineage_summary": {},
        "divergence_summary": agg["drift_summary"],
        "governance_summary": agg,
        "lifecycle_summary": {},
        "operational_notes": [f"nodes={agg['node_count']}"],
        "federation_health_summary": agg,
        "topology_summary": agg["topology_summary"],
        "rollout_safety_score": agg["rollout_safety_score"],
    }
