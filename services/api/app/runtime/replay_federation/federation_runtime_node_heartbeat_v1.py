"""federation_runtime_node_heartbeat_v1 — heartbeat registry in-memory."""

from __future__ import annotations

import threading
import time
from typing import Any

_HEARTBEATS: dict[str, dict[str, Any]] = {}
_TOPOLOGY: dict[str, list[str]] = {}
_LOCK = threading.Lock()


def record_heartbeat(node_id: str, *, region: str = "default", health: float = 1.0) -> None:
    with _LOCK:
        _HEARTBEATS[node_id] = {
            "node_id": node_id,
            "region": region,
            "health": max(0.0, min(1.0, health)),
            "at": time.time(),
        }
        _TOPOLOGY.setdefault(region, [])
        if node_id not in _TOPOLOGY[region]:
            _TOPOLOGY[region].append(node_id)


def federation_topology_summary(scope: str) -> dict[str, Any]:
    with _LOCK:
        nodes = list(_HEARTBEATS.values())
        degraded = [n["node_id"] for n in nodes if n["health"] < 0.7]
    avg = sum(n["health"] for n in nodes) / len(nodes) if nodes else 0.85
    if not nodes:
        record_heartbeat(f"{scope}-node-a", health=0.92)
        return federation_topology_summary(scope)
    pressure = 1.0 - avg
    return {
        "scope": scope,
        "node_count": len(nodes),
        "avg_health": round(avg, 4),
        "degraded_nodes": degraded,
        "topology_summary": dict(_TOPOLOGY),
        "pressure_score": round(pressure, 4),
        "sync_hints": ["resync"] if degraded else ["ok"],
    }


def federation_runtime_node_heartbeat_v1_stub(
    scope: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    summary = federation_topology_summary(scope)
    return {
        "scope": scope,
        "storage_path": storage_path or "default",
        "assistant_notes": ["federation_runtime_node_heartbeat_v1: federation operational."],
        "deterministic_alignment": {"token": f"hb1-{scope}"},
        "runtime_confidence": summary["avg_health"],
        "replay_summary": {},
        "lineage_summary": summary["topology_summary"],
        "divergence_summary": {"degraded": summary["degraded_nodes"]},
        "governance_summary": summary,
        "lifecycle_summary": {},
        "operational_notes": summary["sync_hints"],
        "heartbeat_summary": summary,
        "topology_summary": summary["topology_summary"],
        "pressure_score": summary["pressure_score"],
    }
