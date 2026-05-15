"""Lifecycle core in-memory (stdlib, sprint v7)."""

from __future__ import annotations

import threading
import time
from typing import Any

_STATES: dict[str, str] = {}
_LOCK = threading.Lock()
_VALID = ("bootstrapping", "running", "degraded", "stopping", "stopped", "recovering")


def lifecycle_bootstrap(scope: str) -> dict[str, Any]:
    with _LOCK:
        _STATES[scope] = "bootstrapping"
        time.sleep(0)
        _STATES[scope] = "running"
    return {"scope": scope, "state": "running", "bootstrapped_at": time.time()}


def lifecycle_shutdown(scope: str) -> dict[str, Any]:
    with _LOCK:
        _STATES[scope] = "stopping"
        _STATES[scope] = "stopped"
    return {"scope": scope, "state": "stopped"}


def lifecycle_transition(scope: str, target: str) -> dict[str, Any]:
    if target not in _VALID:
        target = "degraded"
    with _LOCK:
        prev = _STATES.get(scope, "stopped")
        _STATES[scope] = target
    return {"scope": scope, "from": prev, "to": target}


def lifecycle_summary(scope: str) -> dict[str, Any]:
    with _LOCK:
        state = _STATES.get(scope, "stopped")
    return {
        "scope": scope,
        "state": state,
        "integrity_ok": state in ("running", "degraded"),
    }
