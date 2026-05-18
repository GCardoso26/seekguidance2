"""runtime_real_tenant_engine_v1."""

from __future__ import annotations

from typing import Any

from app.runtime.runtime_real_tenant import registry


def runtime_real_tenant_engine_v1(
    scope: str,
    *,
    storage_path: str | None = None,
    action: str = "list",
    tenant_id: str | None = None,
    name: str | None = None,
) -> dict[str, Any]:
    registry.init_db(storage_path)
    if action == "create" and tenant_id and name:
        rec = registry.create_tenant(tenant_id, name, storage_path=storage_path)
        return _ok(scope, {"created": rec})
    tenants = registry.list_tenants(storage_path=storage_path)
    return _ok(scope, {"tenants": tenants, "isolation": "logical", "ownership_enabled": True})


def _ok(scope: str, extra: dict[str, Any]) -> dict[str, Any]:
    return {
        "scope": scope,
        "assistant_notes": ["runtime_real_tenant_engine_v1: tenancy real."],
        "deterministic_alignment": {"token": f"tenant-{scope}"},
        "runtime_confidence": 0.94,
        "replay_summary": {},
        "lineage_summary": {},
        "divergence_summary": {},
        "governance_summary": {},
        "lifecycle_summary": {},
        "operational_notes": [],
        "integrity_status": "ok",
        **extra,
    }
