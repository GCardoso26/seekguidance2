"""runtime_operator_activity_v2 — product layer v2."""

from __future__ import annotations

import threading
from typing import Any

from app.runtime.product_runtime.runtime_product_summary_v1 import runtime_product_engine_v1

_ACTIVITY: dict[str, int] = {}
_LOCK = threading.Lock()


def product_runtime_engine_v2(scope: str) -> dict[str, Any]:
    base = runtime_product_engine_v1(scope)
    with _LOCK:
        _ACTIVITY[scope] = _ACTIVITY.get(scope, 0) + 1
        acts = _ACTIVITY[scope]
    ux = max(0.0, base.get("product_score", 0.9) - acts * 0.001)
    integrity = base.get("integrity_status", "ok")
    return {
        "product_score": round(ux, 4),
        "onboarding_orchestration": base.get("onboarding_metadata", {}),
        "tenant_provisioning": base.get("tenant_registries", {}),
        "user_provisioning": base.get("user_registries", {}),
        "governance_ui_summary": base.get("governance_ui_summary", {}),
        "auth_flow_summary": {"mode": "production"},
        "operational_ux_scoring": round(ux, 4),
        "usage_summary": {"events": acts},
        "operator_activity_summary": dict(_ACTIVITY),
        "integrity_status": integrity,
        "runtime_confidence": round(ux, 4),
    }


def runtime_operator_activity_v2_stub(
    scope: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    report = product_runtime_engine_v2(scope)
    return {
        "scope": scope,
        "storage_path": storage_path or "default",
        "assistant_notes": ["product_runtime_engine_v2: product v2."],
        "deterministic_alignment": {"token": f"prod2-{scope}"},
        "runtime_confidence": report["runtime_confidence"],
        "replay_summary": {},
        "lineage_summary": report["usage_summary"],
        "divergence_summary": {},
        "governance_summary": report["governance_ui_summary"],
        "lifecycle_summary": {},
        "operational_notes": [],
        "integrity_status": report["integrity_status"],
        **report,
    }
