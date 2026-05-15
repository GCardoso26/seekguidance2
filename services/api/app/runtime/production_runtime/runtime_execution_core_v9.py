"""Core de execução v9: queue, retry, deadletter, timeout."""

from __future__ import annotations

import hashlib
import json
import queue
import threading
import time
from collections.abc import Mapping
from typing import Any

_QUEUE: queue.Queue[dict[str, Any]] = queue.Queue()
_DEADLETTER: list[dict[str, Any]] = []
_RETRY: dict[str, int] = {}
_TIMEOUTS: dict[str, float] = {}
_LOCK = threading.Lock()
_MAX_INFLIGHT = 64


def dispatch_execution(
    scope: str,
    payload: Mapping[str, Any] | None = None,
    *,
    priority: int = 0,
    timeout_s: float = 30.0,
) -> dict[str, Any]:
    token = hashlib.sha256(
        json.dumps({"scope": scope, "p": dict(payload or {})}, sort_keys=True).encode()
    ).hexdigest()[:20]
    item = {
        "scope": scope,
        "token": token,
        "payload": dict(payload or {}),
        "priority": priority,
        "enqueued_at": time.time(),
    }
    with _LOCK:
        if _QUEUE.qsize() >= _MAX_INFLIGHT:
            _DEADLETTER.append({**item, "reason": "backpressure"})
            return {"accepted": False, "token": token, "deadletter": True}
        _TIMEOUTS[token] = time.time() + timeout_s
        _RETRY[token] = 0
    _QUEUE.put(item)
    return {
        "accepted": True,
        "token": token,
        "queue_depth": _QUEUE.qsize(),
        "retry_count": 0,
    }


def execution_snapshot() -> dict[str, Any]:
    with _LOCK:
        return {
            "queue_depth": _QUEUE.qsize(),
            "deadletter_count": len(_DEADLETTER),
            "retry_tracked": len(_RETRY),
        }


def record_retry(token: str) -> int:
    with _LOCK:
        _RETRY[token] = _RETRY.get(token, 0) + 1
        count = _RETRY[token]
        if count > 3:
            _DEADLETTER.append({"token": token, "reason": "max_retries"})
        return count
