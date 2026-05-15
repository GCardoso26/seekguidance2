"""runtime_execution_deadletter_runtime_v2 — deadletter via queue.Queue."""

from __future__ import annotations

import queue
import threading
from typing import Any

from app.runtime.production_runtime.runtime_execution_core_v9 import (
    dispatch_execution,
    execution_snapshot,
)

_DL: queue.Queue[dict[str, Any]] = queue.Queue()
_LOCK = threading.Lock()


def push_deadletter(item: dict[str, Any]) -> None:
    _DL.put(item)


def deadletter_snapshot() -> dict[str, Any]:
    items: list[dict[str, Any]] = []
    while not _DL.empty():
        try:
            items.append(_DL.get_nowait())
        except queue.Empty:
            break
    for it in items:
        _DL.put(it)
    return {"count": len(items), "items": items[:16]}


def runtime_execution_deadletter_runtime_v2_stub(scope: str, *, storage_path: str | None = None) -> dict[str, Any]:
    dispatch_execution(scope, {"probe": True})
    snap = execution_snapshot()
    dl = deadletter_snapshot()
    return {
        "scope": scope,
        "storage_path": storage_path or "default",
        "assistant_notes": ["runtime_execution_deadletter_runtime_v2: DL v10."],
        "deterministic_alignment": {"token": f"dl2-{scope}"},
        "runtime_confidence": 0.87,
        "replay_summary": {},
        "lineage_summary": {},
        "divergence_summary": dl,
        "governance_summary": snap,
        "lifecycle_summary": {},
        "operational_notes": [f"deadletter={dl['count']}"],
        "execution_summary": snap,
        "lifecycle_state": "idle",
        "retry_count": snap.get("retry_tracked", 0),
    }
