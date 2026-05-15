"""federation_operational_supervisor_v1 — supervisão RC."""

from __future__ import annotations

import threading
import time
from typing import Any

from app.runtime.replay_federation.federation_supervision_runtime_v2 import (
    federation_health_aggregate,
    register_node,
)

_DEGRADED: set[str] = set()
_LOCK = threading.Lock()


def track_degraded(node_id: str, health: float) -> None:
    with _LOCK:
        if health < 0.7:
            _DEGRADED.add(node_id)
        else:
            _DEGRADED.discard(node_id)


def federation_operational_summary(scope: str) -> dict[str, Any]:
    register_node(f"{scope}-supervisor", health=0.9)
    agg = federation_health_aggregate(scope)
    with _LOCK:
        degraded = sorted(_DEGRADED)
    pressure = 1.0 - agg["avg_health"]
    sync_mismatch = len(agg.get("drift_summary", {}).get("sync_mismatch_hints", []))
    return {
        **agg,
        "degraded_tracked": degraded,
        "pressure_score": round(pressure, 4),
        "sync_mismatch_score": min(1.0, sync_mismatch / 4.0),
        "failover_hints": ["reroute"] if pressure > 0.3 else ["none"],
        "reconciliation_summary": {"at": time.time(), "nodes": agg["node_count"]},
    }


def federation_operational_supervisor_v1_stub(scope: str, *, storage_path: str | None = None) -> dict[str, Any]:
    summary = federation_operational_summary(scope)
    return {
        "scope": scope,
        "storage_path": storage_path or "default",
        "assistant_notes": ["federation_operational_supervisor_v1: RC federation."],
        "deterministic_alignment": {"token": f"fsup1-{scope}"},
        "runtime_confidence": summary["avg_health"],
        "replay_summary": {},
        "lineage_summary": {},
        "divergence_summary": summary.get("drift_summary", {}),
        "governance_summary": summary,
        "lifecycle_summary": {},
        "operational_notes": summary["failover_hints"],
        "federation_health_summary": summary,
        "topology_summary": summary.get("topology_summary", {}),
        "pressure_score": summary["pressure_score"],
    }
