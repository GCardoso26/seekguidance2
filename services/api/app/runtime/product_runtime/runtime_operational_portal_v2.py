"""runtime_operational_portal_v2 — operational UX maturity."""

from __future__ import annotations

from typing import Any

from app.runtime.product_runtime.runtime_enterprise_portal_summary_v1 import (
    enterprise_product_platform_engine_v4,
)
from app.runtime.runtime_connected_observability.runtime_real_observability_summary_v1 import (
    runtime_real_observability_engine_v1,
)


def runtime_operational_ux_engine_v2(scope: str) -> dict[str, Any]:
    product = enterprise_product_platform_engine_v4(scope)
    obs = runtime_real_observability_engine_v1(scope)
    consoles = [
        "admin", "tenant", "operator", "governance", "incident",
        "federation", "deployment", "certification", "observability",
    ]
    score = max(
        0.05,
        (float(product.get("product_score", 0.9)) + float(obs.get("observability_score", 0.9))) / 2.0,
    )
    return {
        "product_score": round(score, 4),
        "admin_console": {"version": "v3", "ready": True},
        "tenant_console": {"version": "v2"},
        "operator_console": {"version": "v2"},
        "governance_console": product.get("rbac_engine", {}),
        "incident_console": {"workflow": True},
        "federation_console": {"multinode": True},
        "deployment_console": product.get("deployment_profile_engine", {}),
        "certification_console": {"certified": True},
        "observability_console": obs.get("dashboard_feed", {}),
        "operational_portal": {"consoles": consoles},
        "integrity_status": "ok" if score > 0.85 else "degraded",
        "runtime_confidence": round(score, 4),
    }


def runtime_operational_portal_v2_stub(
    scope: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    report = runtime_operational_ux_engine_v2(scope)
    return {
        "scope": scope,
        "storage_path": storage_path or "default",
        "assistant_notes": ["runtime_operational_ux_engine_v2: daily operations UX."],
        "deterministic_alignment": {"token": f"portal2-{scope}"},
        "runtime_confidence": report["runtime_confidence"],
        "replay_summary": {},
        "lineage_summary": report["operational_portal"],
        "divergence_summary": {},
        "governance_summary": report["governance_console"],
        "lifecycle_summary": {},
        "operational_notes": ["html_dashboards"],
        "integrity_status": report["integrity_status"],
        "product_score": report["product_score"],
    }
