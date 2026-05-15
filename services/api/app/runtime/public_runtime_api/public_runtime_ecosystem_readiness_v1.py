"""public_runtime_ecosystem_readiness_v1 — public SDK / API maturity."""

from __future__ import annotations

from typing import Any


def public_runtime_ecosystem_readiness_engine_v1(scope: str) -> dict[str, Any]:
    from app.runtime.public_runtime_api.public_runtime_api_summary_v1 import (
        public_runtime_api_engine_v1,
    )

    base = public_runtime_api_engine_v1(scope)
    score = max(0.05, float(base.get("public_api_score", 0.9)) + 0.01)
    return {
        "sdk_score": round(min(1.0, score), 4),
        "sdk_v1": {"bootstrap": True},
        "client_registry": {"default": "python"},
        "release_channel_v1": {"stable": True},
        "support_lifecycle": {"lts_months": 12},
        "compatibility_matrix_v2": base.get("compatibility", {}),
        "api_contract_engine_v2": {"warnings": True},
        "migration_runtime_v2": {"sqlite_default": True},
        "upgrade_assistant": {"planned": True},
        "sdk_summary": base,
        "ecosystem_readiness": {"ok": score > 0.88},
        "integrity_status": base.get("integrity_status", "ok"),
        "runtime_confidence": round(min(1.0, score), 4),
    }


def public_runtime_ecosystem_readiness_v1_stub(
    scope: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    report = public_runtime_ecosystem_readiness_engine_v1(scope)
    return {
        "scope": scope,
        "storage_path": storage_path or "default",
        "assistant_notes": ["public_runtime_ecosystem_readiness_engine_v1: SDK readiness."],
        "deterministic_alignment": report["sdk_v1"],
        "runtime_confidence": report["runtime_confidence"],
        "replay_summary": report["migration_runtime_v2"],
        "lineage_summary": report["client_registry"],
        "divergence_summary": {},
        "governance_summary": report,
        "lifecycle_summary": report["support_lifecycle"],
        "operational_notes": ["gradual_freeze"],
        "integrity_status": report["integrity_status"],
        "sdk_score": report["sdk_score"],
    }
