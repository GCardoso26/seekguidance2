"""federation_multinode_runtime_v1 — multi-node federation sandbox."""

from __future__ import annotations

import queue
import threading
from typing import Any

from app.runtime.federation_coordination.federation_runtime_coordination_engine_v1 import (
    federation_runtime_coordination_engine_v1,
)

_NODES: dict[str, dict[str, Any]] = {}
_SYNC_PRESSURE: queue.Queue[str] = queue.Queue()
_LOCK = threading.Lock()


def register_node(node_id: str, *, healthy: bool = True) -> None:
    with _LOCK:
        _NODES[node_id] = {"healthy": healthy, "load": 0.0}


def federation_multinode_runtime_v1(scope: str) -> dict[str, Any]:
    coord = federation_runtime_coordination_engine_v1(scope)
    register_node(f"{scope}-n1")
    register_node(f"{scope}-n2", healthy=False)
    _SYNC_PRESSURE.put(scope)
    with _LOCK:
        degraded = [n for n, m in _NODES.items() if scope in n and not m.get("healthy", True)]
        backlog = _SYNC_PRESSURE.qsize()
    balance = max(0.05, coord.get("coordination_score", 0.9) - len(degraded) * 0.05)
    pressure = min(1.0, backlog / 32.0 + coord.get("federation_pressure", 0.0))
    integrity = "ok" if not degraded or pressure < 0.5 else "degraded"
    return {
        "cluster_score": round(balance, 4),
        "federation_pressure": round(pressure, 4),
        "degraded_nodes": degraded,
        "topology_snapshot": coord.get("topology_snapshot", {}),
        "sync_backlog": backlog,
        "integrity_status": integrity,
        "runtime_confidence": round(balance, 4),
    }


def federation_multinode_runtime_v1_stub(
    scope: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    report = federation_multinode_runtime_v1(scope)
    return {
        "scope": scope,
        "storage_path": storage_path or "default",
        "assistant_notes": ["federation_multinode_runtime_v1: multinode sandbox."],
        "deterministic_alignment": {"token": f"fedmn1-{scope}"},
        "runtime_confidence": report["runtime_confidence"],
        "replay_summary": {},
        "lineage_summary": report["topology_snapshot"],
        "divergence_summary": {"degraded": report["degraded_nodes"]},
        "governance_summary": report,
        "lifecycle_summary": {},
        "operational_notes": ["multinode_balancing"],
        "integrity_status": report["integrity_status"],
        **report,
    }
