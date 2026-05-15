"""pilot_runtime_operational_controller_v2 — supervision pilot production."""

from __future__ import annotations

import queue
import threading
import time
from typing import Any

_LOCK = threading.Lock()
_PRESSURE: dict[str, float] = {}
_ROLLOUT: queue.Queue[dict[str, Any]] = queue.Queue()


def pilot_pressure_snapshot(scope: str) -> dict[str, Any]:
    with _LOCK:
        p = _PRESSURE.get(scope, 0.0)
    depth = _ROLLOUT.qsize()
    degraded = p > 0.7 or depth > 48
    readiness = max(0.0, 1.0 - p - (0.15 if degraded else 0.0))
    return {
        "scope": scope,
        "pressure_score": p,
        "rollout_depth": depth,
        "degraded": degraded,
        "readiness_score": round(readiness, 4),
        "rollout_score": round(readiness * 0.98, 4),
    }


def enqueue_rollout(scope: str, stage: str = "canary") -> None:
    _ROLLOUT.put({"scope": scope, "stage": stage, "at": time.time()})
    with _LOCK:
        _PRESSURE[scope] = min(1.0, _PRESSURE.get(scope, 0.2) + 0.05)


def pilot_runtime_operational_controller_v2_stub(
    scope: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    enqueue_rollout(scope)
    snap = pilot_pressure_snapshot(scope)
    return {
        "scope": scope,
        "storage_path": storage_path or "default",
        "assistant_notes": ["pilot_runtime_operational_controller_v2: production pilot."],
        "deterministic_alignment": {"token": f"pilot2-{scope}"},
        "runtime_confidence": snap["readiness_score"],
        "replay_summary": {},
        "lineage_summary": {"rollout_depth": snap["rollout_depth"]},
        "divergence_summary": {"degraded": snap["degraded"]},
        "governance_summary": snap,
        "lifecycle_summary": {},
        "operational_notes": ["rollout_supervised"],
        "readiness_score": snap["readiness_score"],
        "rollout_score": snap["rollout_score"],
    }
