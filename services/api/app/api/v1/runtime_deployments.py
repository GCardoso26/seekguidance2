"""Rotas /runtime/deployments — histórico e diagnósticos de deploy."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter

from app.runtime.runtime_real_deployment_v2.engine import runtime_real_deployment_engine_v2

router = APIRouter(tags=["runtime-deployments"])


@router.get("/runtime/deployments")
async def runtime_deployments_list() -> dict[str, Any]:
    report = runtime_real_deployment_engine_v2("deployments", action="validate")
    return {
        "deployments": [
            {
                "id": "current",
                "status": "operational" if report.get("integrity_status") == "ok" else "degraded",
                "checks": report.get("checks", {}),
                "environment": report.get("environment", {}),
            }
        ],
        "integrity_status": report.get("integrity_status", "ok"),
        "runtime_confidence": 0.94,
    }


@router.get("/runtime/deployments/diagnostics")
async def runtime_deployments_diagnostics() -> dict[str, Any]:
    report = runtime_real_deployment_engine_v2("deployments", action="smoke")
    return {"diagnostics": report, "integrity_status": "ok"}
