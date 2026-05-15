"""runtime_incident_storage_v1 — storage in-memory."""

from __future__ import annotations

import threading
import time
from typing import Any

_STORE: dict[str, dict[str, Any]] = {}
_LOCK = threading.Lock()


def store_incident(incident_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    entry = {"incident_id": incident_id, "payload": payload, "stored_at": time.time(), "state": "open"}
    with _LOCK:
        _STORE[incident_id] = entry
    return entry


def runtime_incident_storage_v1_stub(scope: str, *, storage_path: str | None = None) -> dict[str, Any]:
    entry = store_incident(scope, {"scope": scope})
    return {
        "scope": scope,
        "storage_path": storage_path or "memory",
        "assistant_notes": ["runtime_incident_storage_v1: incident store v9."],
        "deterministic_alignment": {"token": f"incst-{scope}"},
        "runtime_confidence": 0.87,
        "replay_summary": {},
        "lineage_summary": {},
        "divergence_summary": {},
        "governance_summary": {},
        "lifecycle_summary": {},
        "operational_notes": [],
        "incident_workflow_state": entry["state"],
        "alert_summary": {"stored": True},
    }
