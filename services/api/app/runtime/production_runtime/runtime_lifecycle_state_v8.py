"""Lifecycle state machine V8 (in-memory, stdlib)."""

from __future__ import annotations

import threading
from typing import Any

_STATES: dict[str, str] = {}
_LOCK = threading.Lock()
_VALID = (
    "bootstrapping",
    "warming",
    "operational",
    "degraded",
    "recovery",
    "rollback",
    "shutdown",
)


def lifecycle_transition_v8(scope: str, target: str, *, reason: str = "") -> dict[str, Any]:
    if target not in _VALID:
        target = "degraded"
    with _LOCK:
        prev = _STATES.get(scope, "shutdown")
        _STATES[scope] = target
    return {
        "scope": scope,
        "from_state": prev,
        "to_state": target,
        "transition_reasoning": [reason or f"{prev}->{target}"],
    }


def lifecycle_snapshot_v8(scope: str) -> dict[str, Any]:
    with _LOCK:
        state = _STATES.get(scope, "shutdown")
    return {
        "scope": scope,
        "runtime_operational_state": state,
        "lifecycle_summary": {"state": state, "integrity_ok": state in ("operational", "warming")},
        "degradation_summary": {"degraded": state == "degraded"},
    }
