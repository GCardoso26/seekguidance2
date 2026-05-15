"""runtime_incident_registry_v2 — registry in-memory + timelines."""

from __future__ import annotations

import threading
import time
from typing import Any

_REGISTRY: dict[str, dict[str, Any]] = {}
_TIMELINES: dict[str, list[dict[str, Any]]] = {}
_LOCK = threading.Lock()

_SEVERITY = {"low": 0.25, "medium": 0.5, "high": 0.75, "critical": 1.0}


def register_incident(
    incident_id: str,
    *,
    severity: str = "medium",
    scope: str = "runtime",
    replay_ref: str | None = None,
) -> dict[str, Any]:
    score = _SEVERITY.get(severity, 0.5)
    entry = {
        "incident_id": incident_id,
        "severity": severity,
        "severity_score": score,
        "scope": scope,
        "replay_ref": replay_ref,
        "state": "open",
        "created_at": time.time(),
    }
    with _LOCK:
        _REGISTRY[incident_id] = entry
        _TIMELINES.setdefault(incident_id, []).append(
            {"event": "registered", "at": entry["created_at"]}
        )
    return entry


def incident_operational_summary(scope: str) -> dict[str, Any]:
    with _LOCK:
        items = [v for v in _REGISTRY.values() if v.get("scope") == scope or scope == "all"]
        timelines = {k: v[-5:] for k, v in _TIMELINES.items()}
    slo_violations = sum(1 for i in items if i["severity_score"] >= 0.75)
    return {
        "scope": scope,
        "open_count": sum(1 for i in items if i["state"] == "open"),
        "slo_violations": slo_violations,
        "incidents": items[:32],
        "timelines": timelines,
    }


def runtime_incident_registry_v2_stub(scope: str, *, storage_path: str | None = None) -> dict[str, Any]:
    register_incident(f"{scope}-auto", severity="medium", scope=scope)
    summary = incident_operational_summary(scope)
    return {
        "scope": scope,
        "storage_path": storage_path or "default",
        "assistant_notes": ["runtime_incident_registry_v2: workflows v10."],
        "deterministic_alignment": {"token": f"inc2-{scope}"},
        "runtime_confidence": 0.86,
        "replay_summary": {},
        "lineage_summary": {},
        "divergence_summary": {},
        "governance_summary": summary,
        "lifecycle_summary": {},
        "operational_notes": [f"open={summary['open_count']}"],
        "incident_workflow_state": "open",
        "severity_score": 0.5,
        "alert_summary": summary,
    }
