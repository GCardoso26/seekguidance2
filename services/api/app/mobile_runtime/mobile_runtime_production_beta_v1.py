"""mobile_runtime_production_beta_v1 — mobile production beta."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime.mobile_runtime_operational_beta_v2 import mobile_operational_score


def mobile_production_score(device_id: str) -> dict[str, Any]:
    base = mobile_operational_score(device_id)
    score = base["mobile_operational_score"] * 0.98
    return {**base, "mobile_production_score": round(score, 4)}


def mobile_runtime_production_beta_v1_stub(
    device_id: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    report = mobile_production_score(device_id)
    return {
        "device_id": device_id,
        "scope": device_id,
        "storage_path": storage_path or "default",
        "assistant_notes": ["mobile_runtime_production_beta_v1: mobile production."],
        "deterministic_alignment": {"token": f"mprod1-{device_id}"},
        "runtime_confidence": report["mobile_production_score"],
        "replay_summary": {},
        "lineage_summary": {},
        "divergence_summary": {"conflicts": report.get("conflicts", 0)},
        "governance_summary": report,
        "lifecycle_summary": {},
        "operational_notes": [],
        "mobile_production_score": report["mobile_production_score"],
    }
