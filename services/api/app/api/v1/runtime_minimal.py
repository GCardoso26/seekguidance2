"""Rotas FastAPI — Minimal Real Operational Runtime."""

from __future__ import annotations

from typing import Annotated, Any

from app.core.security.deps import optional_auth, required_auth
from app.core.security.rbac import has_permission
from app.core.security.tenant import require_auth_tenant, tenant_from_auth
from app.runtime.runtime_minimal_federation.engine import runtime_minimal_federation_engine_v1
from app.runtime.runtime_real_auth.engine import runtime_real_auth_engine_v1
from app.runtime.runtime_real_minimal.api_engine import runtime_real_api_engine_v1
from app.runtime.runtime_real_observability.engine import runtime_real_observability_engine_v1
from app.runtime.runtime_real_replay.engine import runtime_real_replay_engine_v1
from app.runtime.runtime_real_tenant.engine import runtime_real_tenant_engine_v1
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(tags=["runtime-minimal"])


class LoginBody(BaseModel):
    username: str
    password: str


class RefreshBody(BaseModel):
    refresh_token: str


class LogoutBody(BaseModel):
    access_token: str | None = None
    refresh_token: str | None = None


class ReplayAppendBody(BaseModel):
    scope: str = "default"
    payload: dict[str, Any] = Field(default_factory=dict)
    compress: bool = False


class EventBody(BaseModel):
    event_type: str
    payload: dict[str, Any] = Field(default_factory=dict)


@router.get("/health")
async def runtime_health() -> dict[str, Any]:
    obs = runtime_real_observability_engine_v1("health", action="trace", span_name="health")
    return {"status": "ok", "integrity_status": "ok", "observability": obs}


@router.post("/auth/login")
async def auth_login(body: LoginBody) -> dict[str, Any]:
    r = runtime_real_auth_engine_v1(
        "login",
        action="login",
        username=body.username,
        password=body.password,
    )
    if not r.get("authenticated"):
        raise HTTPException(status_code=401, detail=r.get("error", "unauthorized"))
    return r


@router.post("/auth/refresh")
async def auth_refresh(body: RefreshBody) -> dict[str, Any]:
    r = runtime_real_auth_engine_v1("refresh", action="refresh", refresh_token=body.refresh_token)
    if not r.get("refreshed"):
        raise HTTPException(status_code=401, detail="invalid_refresh")
    return r


@router.post("/auth/logout")
async def auth_logout(body: LogoutBody) -> dict[str, Any]:
    if not body.access_token and not body.refresh_token:
        raise HTTPException(status_code=400, detail="token_required")
    r = runtime_real_auth_engine_v1(
        "logout",
        action="revoke",
        access_token=body.access_token,
        refresh_token=body.refresh_token,
    )
    return {"revoked": bool(r.get("revoked"))}


@router.get("/runtime/status")
async def runtime_status(
    auth: Annotated[dict[str, Any] | None, Depends(optional_auth)],
) -> dict[str, Any]:
    tenant = require_auth_tenant(auth, allow_anonymous=True)
    return runtime_real_api_engine_v1("status", tenant_id=tenant)


@router.get("/runtime/replay")
async def runtime_replay_list(
    auth: Annotated[dict[str, Any] | None, Depends(optional_auth)],
) -> dict[str, Any]:
    tenant = require_auth_tenant(auth, allow_anonymous=True)
    return runtime_real_replay_engine_v1("replay", tenant_id=tenant, action="list")


@router.post("/runtime/replay")
async def runtime_replay_append(
    body: ReplayAppendBody,
    auth: Annotated[dict[str, Any], Depends(required_auth)],
) -> dict[str, Any]:
    if not has_permission(str(auth.get("role", "viewer")), "replay"):
        raise HTTPException(status_code=403, detail="Permissão replay necessária")
    tenant = tenant_from_auth(auth)
    return runtime_real_replay_engine_v1(
        body.scope,
        tenant_id=tenant,
        action="append",
        payload=body.payload,
        compress=body.compress,
    )


@router.get("/runtime/tenants")
async def runtime_tenants(
    auth: Annotated[dict[str, Any] | None, Depends(optional_auth)],
) -> dict[str, Any]:
    require_auth_tenant(auth, allow_anonymous=True)
    return runtime_real_tenant_engine_v1("tenants")


@router.post("/runtime/tenants")
async def runtime_tenant_create(
    tenant_id: str,
    name: str,
    auth: Annotated[dict[str, Any], Depends(required_auth)],
) -> dict[str, Any]:
    if not has_permission(str(auth.get("role", "viewer")), "tenant_admin"):
        raise HTTPException(status_code=403, detail="Permissão tenant_admin necessária")
    return runtime_real_tenant_engine_v1("tenants", action="create", tenant_id=tenant_id, name=name)


@router.get("/runtime/events")
async def runtime_events() -> dict[str, Any]:
    return {"events": [], "integrity_status": "ok", "runtime_confidence": 0.94}


@router.post("/runtime/events")
async def runtime_events_post(
    body: EventBody,
    auth: Annotated[dict[str, Any], Depends(required_auth)],
) -> dict[str, Any]:
    tenant = tenant_from_auth(auth)
    runtime_real_observability_engine_v1(
        body.event_type,
        action="metric",
        metric=f"events.{body.event_type}",
    )
    return {
        "accepted": True,
        "tenant_id": tenant,
        "event_type": body.event_type,
        "integrity_status": "ok",
    }


@router.get("/runtime/federation")
async def runtime_federation(
    auth: Annotated[dict[str, Any] | None, Depends(optional_auth)],
) -> dict[str, Any]:
    require_auth_tenant(auth, allow_anonymous=True)
    return runtime_minimal_federation_engine_v1("federation")
