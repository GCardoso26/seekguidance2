"""Motor de execução in-memory (stdlib, sprint v6)."""

from __future__ import annotations

import hashlib
import json
import queue
import threading
import time
from collections.abc import Mapping
from typing import Any

_EXEC_QUEUE: queue.Queue[dict[str, Any]] = queue.Queue()
_EXEC_STATE: dict[str, str] = {}
_EXEC_BUDGET: dict[str, int] = {"max_inflight": 32, "used": 0}
_LOCK = threading.Lock()


def enqueue_runtime_execution(
    scope: str,
    payload: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    token = hashlib.sha256(
        json.dumps({"scope": scope, "payload": dict(payload or {})}, sort_keys=True).encode()
    ).hexdigest()[:20]
    item = {"scope": scope, "token": token, "payload": dict(payload or {}), "enqueued_at": time.time()}
    with _LOCK:
        if _EXEC_BUDGET["used"] >= _EXEC_BUDGET["max_inflight"]:
            return {
                "accepted": False,
                "reason": "backpressure",
                "token": token,
                "queue_depth": _EXEC_QUEUE.qsize(),
            }
        _EXEC_BUDGET["used"] += 1
        _EXEC_STATE[scope] = "queued"
    _EXEC_QUEUE.put(item)
    return {
        "accepted": True,
        "token": token,
        "queue_depth": _EXEC_QUEUE.qsize(),
        "execution_state": _EXEC_STATE.get(scope, "queued"),
    }


def runtime_execution_engine_summary(scope: str) -> dict[str, Any]:
    with _LOCK:
        return {
            "scope": scope,
            "queue_depth": _EXEC_QUEUE.qsize(),
            "execution_state": _EXEC_STATE.get(scope, "idle"),
            "budget": dict(_EXEC_BUDGET),
        }
