"""runtime_real_api_engine_v1 — orquestra estado da API minimal."""

from __future__ import annotations

from typing import Any

from app.runtime.runtime_minimal_federation.engine import runtime_minimal_federation_engine_v1
from app.runtime.runtime_real_auth.engine import runtime_real_auth_engine_v1
from app.runtime.runtime_real_replay.engine import runtime_real_replay_engine_v1
from app.runtime.runtime_real_tenant.engine import runtime_real_tenant_engine_v1


def runtime_real_api_engine_v1(
    scope: str,
    *,
    storage_root: str | None = None,
    tenant_id: str = "default",
) -> dict[str, Any]:
    auth = runtime_real_auth_engine_v1(scope, storage_path=_sub(storage_root, "auth.sqlite"))
    tenants = runtime_real_tenant_engine_v1(scope, storage_path=_sub(storage_root, "tenants.sqlite"))
    replay = runtime_real_replay_engine_v1(
        scope,
        storage_path=_sub(storage_root, "replay.sqlite"),
        tenant_id=tenant_id,
    )
    federation = runtime_minimal_federation_engine_v1(scope, storage_path=_sub(storage_root, "federation.sqlite"))
    return {
        "scope": scope,
        "assistant_notes": ["runtime_real_api_engine_v1: Minimal Real Operational Runtime."],
        "deterministic_alignment": {"token": f"api-{scope}"},
        "runtime_confidence": 0.94,
        "replay_summary": replay.get("replay_summary", {}),
        "lineage_summary": {},
        "divergence_summary": {},
        "governance_summary": {},
        "lifecycle_summary": {},
        "operational_notes": ["routes: /health /auth/* /runtime/*"],
        "integrity_status": "ok",
        "status": "operational",
        "auth": auth,
        "tenants": tenants,
        "replay": replay,
        "federation": federation,
        "openapi": "/docs",
    }


def _sub(root: str | None, name: str) -> str | None:
    if not root:
        return None
    from pathlib import Path

    return str(Path(root) / name)
