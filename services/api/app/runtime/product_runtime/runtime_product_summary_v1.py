"""runtime_product_summary_v1 — product runtime layer."""

from __future__ import annotations

import threading
from typing import Any

from app.runtime.productization.runtime_productization_runtime_v1 import (
    runtime_productization_engine_v1,
)

_USERS: dict[str, dict[str, Any]] = {}
_LOCK = threading.Lock()


def runtime_product_engine_v1(scope: str) -> dict[str, Any]:
    prod = runtime_productization_engine_v1(scope)
    with _LOCK:
        _USERS[scope] = {"onboarded": True, "profile": "operator"}
    score = prod.get("productization_score", 0.9)
    integrity = prod.get("integrity_status", "ok")
    return {
        "product_score": round(score, 4),
        "onboarding_metadata": {"ready": True, "scope": scope},
        "tenant_registries": prod.get("tenant_registry", {}),
        "user_registries": dict(_USERS),
        "governance_ui_summary": {"panels": ["replay", "governance"]},
        "runtime_profile_metadata": {"mode": "production"},
        "integrity_status": integrity,
        "runtime_confidence": round(score, 4),
    }


def runtime_product_summary_v1_stub(
    scope: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    report = runtime_product_engine_v1(scope)
    return {
        "scope": scope,
        "storage_path": storage_path or "default",
        "assistant_notes": ["runtime_product_engine_v1: product layer."],
        "deterministic_alignment": {"token": f"product1-{scope}"},
        "runtime_confidence": report["runtime_confidence"],
        "replay_summary": {},
        "lineage_summary": report["onboarding_metadata"],
        "divergence_summary": {},
        "governance_summary": report["governance_ui_summary"],
        "lifecycle_summary": {},
        "operational_notes": [],
        "integrity_status": report["integrity_status"],
        "product_score": report["product_score"],
    }
