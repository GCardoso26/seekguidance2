"""runtime_operational_controller_v1 — supervision loops e backlog RC."""

from __future__ import annotations

import queue
import threading
import time
from typing import Any

from app.runtime.production_runtime.runtime_execution_core_v9 import execution_snapshot

_BACKLOG: queue.Queue[dict[str, Any]] = queue.Queue()
_PRESSURE: dict[str, float] = {}
_LOCK = threading.Lock()


def enqueue_backlog(scope: str, priority: int = 0) -> dict[str, Any]:
    item = {"scope": scope, "priority": priority, "at": time.time()}
    _BACKLOG.put(item)
    with _LOCK:
        depth = _BACKLOG.qsize()
        _PRESSURE[scope] = min(1.0, depth / 64.0)
    return {"enqueued": True, "depth": depth, "pressure": _PRESSURE[scope]}


def operational_snapshot(scope: str) -> dict[str, Any]:
    exec_snap = execution_snapshot()
    with _LOCK:
        pressure = _PRESSURE.get(scope, 0.0)
    backlog_depth = _BACKLOG.qsize()
    starvation = backlog_depth > 48
    degraded = pressure > 0.75 or exec_snap.get("deadletter_count", 0) > 0
    stability = max(0.0, 1.0 - pressure - (0.1 if degraded else 0.0))
    return {
        "scope": scope,
        "backlog_depth": backlog_depth,
        "backlog_score": min(1.0, backlog_depth / 64.0),
        "pressure_score": pressure,
        "stability_score": stability,
        "starvation_hint": starvation,
        "degraded_execution": degraded,
        "execution": exec_snap,
    }


def runtime_operational_controller_v1_stub(scope: str, *, storage_path: str | None = None) -> dict[str, Any]:
    enqueue_backlog(scope)
    snap = operational_snapshot(scope)
    return {
        "scope": scope,
        "storage_path": storage_path or "default",
        "assistant_notes": ["runtime_operational_controller_v1: RC supervision."],
        "deterministic_alignment": {"token": f"opc1-{scope}"},
        "runtime_confidence": snap["stability_score"],
        "replay_summary": {},
        "lineage_summary": {},
        "divergence_summary": {"degraded": snap["degraded_execution"]},
        "governance_summary": snap,
        "lifecycle_summary": {},
        "operational_notes": (
            ["starvation_detected"] if snap["starvation_hint"] else ["operational_ok"]
        ),
        "execution_summary": snap["execution"],
        "backlog_score": snap["backlog_score"],
        "pressure_score": snap["pressure_score"],
    }
