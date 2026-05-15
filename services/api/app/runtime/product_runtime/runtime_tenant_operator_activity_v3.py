"""runtime_tenant_operator_activity_v3 — enterprise product layer v3."""

from __future__ import annotations

import threading
from typing import Any

from app.runtime.product_runtime.runtime_operator_activity_v2 import product_runtime_engine_v2
from app.runtime.security_compliance.runtime_security_operational_engine_v2 import (
    runtime_security_operational_engine_v2,
)

_ACTIVITY: dict[str, int] = {}
_LOCK = threading.Lock()


def enterprise_product_runtime_engine_v3(scope: str) -> dict[str, Any]:
    prod = product_runtime_engine_v2(scope)
    sec = runtime_security_operational_engine_v2(scope)
    with _LOCK:
        _ACTIVITY[scope] = _ACTIVITY.get(scope, 0) + 1
    score = (prod.get("product_score", 0.9) + sec.get("security_score", 0.9)) / 2.0
    integrity = "ok" if sec.get("integrity_status") == "ok" else "degraded"
    return {
        "product_score": round(score, 4),
        "auth_orchestration": sec.get("auth_summary", {}),
        "rbac_validation": sec.get("rbac_summary", {}),
        "tenant_management": prod.get("tenant_provisioning", {}),
        "onboarding_flows": prod.get("onboarding_orchestration", {}),
        "release_channels": ["pilot", "production"],
        "admin_summary": prod.get("governance_ui_summary", {}),
        "tenant_operator_activity": dict(_ACTIVITY),
        "operational_ux_scoring": prod.get("operational_ux_scoring", 0.9),
        "integrity_status": integrity,
        "runtime_confidence": round(score, 4),
    }


def runtime_tenant_operator_activity_v3_stub(
    scope: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    report = enterprise_product_runtime_engine_v3(scope)
    return {
        "scope": scope,
        "storage_path": storage_path or "default",
        "assistant_notes": ["enterprise_product_runtime_engine_v3: product v3."],
        "deterministic_alignment": {"token": f"eprod3-{scope}"},
        "runtime_confidence": report["runtime_confidence"],
        "replay_summary": {},
        "lineage_summary": report["onboarding_flows"],
        "divergence_summary": report["tenant_operator_activity"],
        "governance_summary": report["admin_summary"],
        "lifecycle_summary": {},
        "operational_notes": report["release_channels"],
        "integrity_status": report["integrity_status"],
        **report,
    }
