"""mobile_runtime_operational_beta_v2 — mobile operational beta."""

from __future__ import annotations

import queue
import threading
from typing import Any

from app.mobile_runtime.mobile_runtime_operational_sync_v1 import sync_enqueue

_CONFLICTS: dict[str, int] = {}
_LOCK = threading.Lock()
_QUEUE: queue.Queue[str] = queue.Queue()


def mobile_operational_score(device_id: str) -> dict[str, Any]:
    sync_enqueue(device_id)
    _QUEUE.put(device_id)
    with _LOCK:
        _CONFLICTS[device_id] = _CONFLICTS.get(device_id, 0)
    backlog = _QUEUE.qsize()
    score = max(0.05, 1.0 - _CONFLICTS[device_id] / 64.0)
    return {
        "device_id": device_id,
        "sync_backlog": backlog,
        "mobile_operational_score": round(score, 4),
        "conflicts": _CONFLICTS[device_id],
    }


def mobile_runtime_operational_beta_v2_stub(
    device_id: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    report = mobile_operational_score(device_id)
    return {
        "device_id": device_id,
        "scope": device_id,
        "storage_path": storage_path or "default",
        "assistant_notes": ["mobile_runtime_operational_beta_v2: mobile beta v2."],
        "deterministic_alignment": {"token": f"mbeta2-{device_id}"},
        "runtime_confidence": report["mobile_operational_score"],
        "replay_summary": {},
        "lineage_summary": {},
        "divergence_summary": {"conflicts": report["conflicts"]},
        "governance_summary": report,
        "lifecycle_summary": {},
        "operational_notes": [],
        "mobile_operational_score": report["mobile_operational_score"],
        "sync_backlog": report["sync_backlog"],
    }
