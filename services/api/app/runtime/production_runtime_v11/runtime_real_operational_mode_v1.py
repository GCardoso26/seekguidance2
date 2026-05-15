"""runtime_real_operational_mode_v1 — production runtime operational mode."""

from __future__ import annotations

from typing import Any


def runtime_real_operational_mode_engine_v1(scope: str) -> dict[str, Any]:
    from app.runtime.runtime_real_infrastructure.runtime_real_operational_summary_v1 import (
        runtime_real_operational_engine_v1,
    )

    base = runtime_real_operational_engine_v1(scope)
    score = max(0.05, float(base.get("operational_score", 0.9)))
    return {
        "operational_score": round(score, 4),
        "mode": "real-operational-v1",
        "supervised": True,
        "filesystem_state": True,
        "integrity_status": base.get("integrity_status", "ok"),
        "runtime_confidence": round(score, 4),
        "operational_bridge": base,
    }


def runtime_real_operational_mode_v1_stub(
    scope: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    report = runtime_real_operational_mode_engine_v1(scope)
    return {
        "scope": scope,
        "storage_path": storage_path or "default",
        "assistant_notes": ["runtime_real_operational_mode_engine_v1: real operational mode."],
        "deterministic_alignment": {"token": f"ropmode1-{scope}"},
        "runtime_confidence": report["runtime_confidence"],
        "replay_summary": report["operational_bridge"],
        "lineage_summary": {},
        "divergence_summary": {},
        "governance_summary": report,
        "lifecycle_summary": {"mode": report["mode"]},
        "operational_notes": ["v11_bridge"],
        "integrity_status": report["integrity_status"],
        "operational_score": report["operational_score"],
    }
