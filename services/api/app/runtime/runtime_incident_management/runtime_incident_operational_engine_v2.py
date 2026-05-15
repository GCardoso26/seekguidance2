"""runtime_incident_operational_engine_v2 — incident operational RC."""

from __future__ import annotations

import time
from typing import Any

from app.runtime.runtime_incident_management.runtime_incident_registry_v2 import (
    incident_operational_summary,
    register_incident,
)


def operational_incident_score(scope: str) -> dict[str, Any]:
    register_incident(f"{scope}-rc", severity="high", scope=scope)
    summary = incident_operational_summary(scope)
    score = max(0.0, 1.0 - summary["slo_violations"] * 0.2 - summary["open_count"] * 0.05)
    return {
        **summary,
        "incident_operational_score": round(score, 4),
        "recovery_hints": ["replay_align"] if summary["slo_violations"] else ["monitor"],
        "timeline_at": time.time(),
    }


def runtime_incident_operational_engine_v2_stub(
    scope: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    report = operational_incident_score(scope)
    return {
        "scope": scope,
        "storage_path": storage_path or "default",
        "assistant_notes": ["runtime_incident_operational_engine_v2: incident RC."],
        "deterministic_alignment": {"token": f"incop2-{scope}"},
        "runtime_confidence": report["incident_operational_score"],
        "replay_summary": {},
        "lineage_summary": report.get("timelines", {}),
        "divergence_summary": {},
        "governance_summary": report,
        "lifecycle_summary": {},
        "operational_notes": report["recovery_hints"],
        "incident_operational_score": report["incident_operational_score"],
        "recovery_hints": report["recovery_hints"],
    }
