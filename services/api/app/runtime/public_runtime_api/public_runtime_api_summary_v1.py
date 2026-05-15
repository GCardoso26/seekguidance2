"""public_runtime_api_summary_v1 — public / enterprise API stabilization."""

from __future__ import annotations

from typing import Any


def public_runtime_api_engine_v1(scope: str) -> dict[str, Any]:
    from app.runtime.runtime_canonical.canonical_runtime_api_v1 import canonical_runtime_api_engine_v1

    canon = canonical_runtime_api_engine_v1(scope)
    semver = {"major": 1, "minor": 0, "patch": 0, "label": "ga-candidate"}
    score = max(0.05, float(canon.get("canonical_score", 0.9)))
    return {
        "public_api_score": round(score, 4),
        "api_registry": {"endpoints": ["execution", "replay", "federation"]},
        "contracts": canon.get("compatibility_layer", []),
        "versioning": semver,
        "sdk_registry": {"languages": ["python"], "optional": True},
        "compatibility": {"backward": True, "adapters": True},
        "support_matrix": {"enterprise": True, "public": "limited"},
        "migration_policy": {"gradual_freeze": True},
        "release_policy": {"semver": True, "channels": ["stable", "ga-candidate"]},
        "semver": semver,
        "integrity_status": canon.get("integrity_status", "ok"),
        "runtime_confidence": round(score, 4),
    }


def public_runtime_api_summary_v1_stub(
    scope: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    report = public_runtime_api_engine_v1(scope)
    return {
        "scope": scope,
        "storage_path": storage_path or "default",
        "assistant_notes": ["public_runtime_api_engine_v1: SDK readiness."],
        "deterministic_alignment": report["semver"],
        "runtime_confidence": report["runtime_confidence"],
        "replay_summary": {},
        "lineage_summary": report["api_registry"],
        "divergence_summary": report["migration_policy"],
        "governance_summary": report["release_policy"],
        "lifecycle_summary": report["versioning"],
        "operational_notes": ["gradual_api_freeze"],
        "integrity_status": report["integrity_status"],
        "public_api_score": report["public_api_score"],
    }
