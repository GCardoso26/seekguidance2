"""canonical_runtime_ecosystem_summary_v1 — ecosystem stabilization."""

from __future__ import annotations

from typing import Any


def canonical_ecosystem_engine_v1(scope: str) -> dict[str, Any]:
    from app.runtime.runtime_canonical.canonical_runtime_api_v1 import canonical_runtime_api_engine_v1

    base = canonical_runtime_api_engine_v1(scope)
    score = max(0.05, float(base.get("canonical_score", 0.9)) + 0.02)
    return {
        "ecosystem_score": round(min(1.0, score), 4),
        "capability_registry": {"domains": base.get("domains", [])},
        "semver_registry": {"major": 1, "minor": 0},
        "migration_engine": {"incremental": True},
        "adapter_engine": {"legacy_ok": True},
        "contract_validator": {"strictness": "warn"},
        "dependency_registry": {"stdlib_first": True},
        "compatibility_engine": {"matrix": "v1"},
        "upgrade_graph": {"nodes": ["v1", "v2"]},
        "release_registry": {"channel": "stable"},
        "integrity_status": base.get("integrity_status", "ok"),
        "runtime_confidence": round(min(1.0, score), 4),
    }


def canonical_runtime_ecosystem_summary_v1_stub(
    scope: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    report = canonical_ecosystem_engine_v1(scope)
    return {
        "scope": scope,
        "storage_path": storage_path or "default",
        "assistant_notes": ["canonical_ecosystem_engine_v1: ecosystem stabilization."],
        "deterministic_alignment": {"token": f"eco1-{scope}"},
        "runtime_confidence": report["runtime_confidence"],
        "replay_summary": report["semver_registry"],
        "lineage_summary": report["capability_registry"],
        "divergence_summary": {},
        "governance_summary": report,
        "lifecycle_summary": report["upgrade_graph"],
        "operational_notes": ["adapters_migrations"],
        "integrity_status": report["integrity_status"],
        "ecosystem_score": report["ecosystem_score"],
    }
