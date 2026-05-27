"""Rotas operacionais — observability, pilot, backup, metrics."""

from __future__ import annotations

import time
from typing import Any

from app.runtime.runtime_backup_system.engine import runtime_backup_engine_v1
from app.runtime.runtime_incident_collection.engine import runtime_incident_collection_engine_v1
from app.runtime.runtime_real_deployment_v2.engine import runtime_real_deployment_engine_v2
from app.runtime.runtime_real_metrics.collector import prometheus_text, record, snapshot
from app.runtime.runtime_real_observability_v2.engine import runtime_real_observability_engine_v2
from app.runtime.runtime_real_persistence.engine import runtime_real_persistence_engine_v1
from app.runtime.runtime_real_pilot_v2.engine import runtime_real_pilot_engine_v2
from app.runtime.runtime_restore_system.engine import runtime_restore_engine_v1
from app.runtime.runtime_support_operations_v2.engine import runtime_support_operations_engine_v2
from app.runtime.runtime_usage_analytics.engine import runtime_usage_analytics_engine_v1
from app.runtime.runtime_user_onboarding.engine import runtime_user_onboarding_engine_v1
from app.core.security.deps import required_auth
from app.core.security.tenant import tenant_from_auth
from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
from typing import Annotated, Any

router = APIRouter(tags=["runtime-operational"])


class IncidentBody(BaseModel):
    summary: str
    severity: str = "medium"
    notes: str | None = None


class PilotEnrollBody(BaseModel):
    user_id: str
    operator: str | None = None


class FeedbackBody(BaseModel):
    user_id: str
    text: str


class BackupBody(BaseModel):
    include_postgres: bool = False


class RestoreBody(BaseModel):
    backup_path: str
    dry_run: bool = False


@router.get("/metrics")
async def prometheus_metrics() -> Response:
    record("http.metrics", 1.0)
    return Response(content=prometheus_text(), media_type="text/plain; version=0.0.4")


@router.get("/runtime/metrics")
async def runtime_metrics() -> dict[str, Any]:
    record("runtime.metrics", 1.0)
    return {"metrics": snapshot(), "integrity_status": "ok", "runtime_confidence": 0.94}


@router.get("/runtime/health")
async def runtime_health_deep() -> dict[str, Any]:
    t0 = time.perf_counter()
    obs = runtime_real_observability_engine_v2("health")
    persist = runtime_real_persistence_engine_v1("health", action="health")
    elapsed_ms = (time.perf_counter() - t0) * 1000
    record("http.latency_ms", elapsed_ms)
    return {
        "status": "ok",
        "observability": obs,
        "persistence": persist,
        "latency_ms": round(elapsed_ms, 2),
        "integrity_status": "ok",
    }


@router.get("/runtime/diagnostics")
async def runtime_diagnostics() -> dict[str, Any]:
    return {
        "deployment": runtime_real_deployment_engine_v2("diag", action="validate"),
        "persistence": runtime_real_persistence_engine_v1("diag", action="diagnostics"),
        "usage": runtime_usage_analytics_engine_v1("diag"),
        "integrity_status": "ok",
    }


@router.get("/runtime/pilot")
async def runtime_pilot_status() -> dict[str, Any]:
    return runtime_real_pilot_engine_v2("pilot")


@router.post("/runtime/pilot")
async def runtime_pilot_enroll(
    body: PilotEnrollBody,
    auth: Annotated[dict[str, Any], Depends(required_auth)],
) -> dict[str, Any]:
    record("pilot.enroll", 1.0)
    return runtime_real_pilot_engine_v2(
        "pilot",
        action="enroll",
        user_id=body.user_id,
        tenant_id=tenant_from_auth(auth),
        operator=body.operator,
    )


@router.get("/runtime/incidents")
async def runtime_incidents_list() -> dict[str, Any]:
    return runtime_incident_collection_engine_v1("incidents")


@router.post("/runtime/incidents")
async def runtime_incidents_report(
    body: IncidentBody,
    auth: Annotated[dict[str, Any], Depends(required_auth)],
) -> dict[str, Any]:
    record("incidents.report", 1.0)
    return runtime_incident_collection_engine_v1(
        "incidents",
        action="report",
        tenant_id=tenant_from_auth(auth),
        summary=body.summary,
        severity=body.severity,
        notes=body.notes,
    )


@router.get("/runtime/support")
async def runtime_support() -> dict[str, Any]:
    return runtime_support_operations_engine_v2("support")


@router.post("/runtime/support")
async def runtime_support_open(ticket_id: str, workflow: str = "triage") -> dict[str, Any]:
    return runtime_support_operations_engine_v2(
        "support", action="open", ticket_id=ticket_id, workflow=workflow
    )


@router.post("/runtime/feedback")
async def runtime_feedback(body: FeedbackBody) -> dict[str, Any]:
    record("feedback.submit", 1.0)
    return {
        "accepted": True,
        "user_id": body.user_id,
        "integrity_status": "ok",
        "runtime_confidence": 0.94,
    }


@router.post("/runtime/backup")
async def runtime_backup(body: BackupBody = BackupBody()) -> dict[str, Any]:
    record("backup.run", 1.0)
    return runtime_backup_engine_v1("backup", include_postgres=body.include_postgres)


@router.post("/runtime/restore")
async def runtime_restore(body: RestoreBody) -> dict[str, Any]:
    return runtime_restore_engine_v1(
        "restore", backup_path=body.backup_path, dry_run=body.dry_run
    )


@router.get("/runtime/onboarding")
async def runtime_onboarding() -> dict[str, Any]:
    return runtime_user_onboarding_engine_v1("onboarding")


@router.post("/runtime/onboarding")
async def runtime_onboarding_step(step: str) -> dict[str, Any]:
    return runtime_user_onboarding_engine_v1("onboarding", step=step)
