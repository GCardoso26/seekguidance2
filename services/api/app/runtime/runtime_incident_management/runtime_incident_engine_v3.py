"""runtime_incident_engine_v3 — registry in-memory."""

from __future__ import annotations

import threading
import time
from typing import Any

_INCIDENTS: dict[str, dict[str, Any]] = {}
_LOCK = threading.Lock()


def register_incident(incident_id: str, severity: float = 0.3) -> dict[str, Any]:
    entry = {
        "incident_id": incident_id,
        "severity": severity,
        "created_at": time.time(),
        "state": "open",
    }
    with _LOCK:
        _INCIDENTS[incident_id] = entry
    return entry


def runtime_incident_engine_v3_stub(scope: str, *, storage_path: str | None = None) -> dict[str, Any]:
    entry = register_incident(scope, severity=0.25)
    return {
        "scope": scope,
        "storage_path": storage_path or "memory",
        "assistant_notes": ["runtime_incident_engine_v3: incident registry v8."],
        "deterministic_alignment": {"token": f"inc3-{scope}"},
        "runtime_confidence": 0.86,
        "replay_summary": {},
        "lineage_summary": {},
        "divergence_summary": {},
        "governance_summary": {},
        "operational_notes": [],
        "incident_severity_score": entry["severity"],
        "incident_timeline": [{"event": "registered", "at": entry["created_at"]}],
    }
