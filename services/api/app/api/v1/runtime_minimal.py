"""Rotas FastAPI — Minimal Real Operational Runtime."""

from __future__ import annotations

from typing import Any

from app.runtime.runtime_minimal_federation.engine import runtime_minimal_federation_engine_v1
from app.runtime.runtime_real_auth import tokens
from app.runtime.runtime_real_auth.engine import runtime_real_auth_engine_v1
from app.runtime.runtime_real_minimal.api_engine import runtime_real_api_engine_v1
from app.runtime.runtime_real_observability.engine import runtime_real_observability_engine_v1
from app.runtime.runtime_real_replay.engine import runtime_real_replay_engine_v1
from app.runtime.runtime_real_tenant.engine import runtime_real_tenant_engine_v1
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(tags=["runtime-minimal"])


class LoginBody(BaseModel):
    username: str
    password: str


class RefreshBody(BaseModel):
    refresh_token: str


class ReplayAppendBody(BaseModel):
    tenant_id: str = "default"
    scope: str = "default"
    payload: dict[str, Any] = Field(default_factory=dict)
    compress: bool = False


class EventBody(BaseModel):
    tenant_id: str = "default"
    event_type: str
    payload: dict[str, Any] = Field(default_factory=dict)


def _tenant_from_auth(authorization: str | None, x_api_key: str | None) -> str:
    if x_api_key:
        r = runtime_real_auth_engine_v1("auth", action="api_key", api_key=x_api_key)
        if r.get("authenticated"):
            return str(r.get("api_key", {}).get("tenant_id", "default"))
    if authorization and authorization.lower().startswith("bearer "):
        tok = authorization.split(" ", 1)[1]
        payload = tokens.decode_access(tok)
        if payload:
            return str(payload.get("tenant_id", "default"))
    return "default"


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


@router.get("/runtime/status")
async def runtime_status(
    authorization: str | None = Header(default=None),
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
) -> dict[str, Any]:
    tenant = _tenant_from_auth(authorization, x_api_key)
    return runtime_real_api_engine_v1("status", tenant_id=tenant)


@router.get("/runtime/replay")
async def runtime_replay_list(
    tenant_id: str | None = None,
    authorization: str | None = Header(default=None),
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
) -> dict[str, Any]:
    tid = tenant_id or _tenant_from_auth(authorization, x_api_key)
    return runtime_real_replay_engine_v1("replay", tenant_id=tid, action="list")


@router.post("/runtime/replay")
async def runtime_replay_append(body: ReplayAppendBody) -> dict[str, Any]:
    return runtime_real_replay_engine_v1(
        body.scope,
        tenant_id=body.tenant_id,
        action="append",
        payload=body.payload,
        compress=body.compress,
    )


@router.get("/runtime/tenants")
async def runtime_tenants() -> dict[str, Any]:
    return runtime_real_tenant_engine_v1("tenants")


@router.post("/runtime/tenants")
async def runtime_tenant_create(tenant_id: str, name: str) -> dict[str, Any]:
    return runtime_real_tenant_engine_v1("tenants", action="create", tenant_id=tenant_id, name=name)


@router.get("/runtime/events")
async def runtime_events() -> dict[str, Any]:
    return {"events": [], "integrity_status": "ok", "runtime_confidence": 0.94}


@router.post("/runtime/events")
async def runtime_events_post(body: EventBody) -> dict[str, Any]:
    runtime_real_observability_engine_v1(
        body.event_type,
        action="metric",
        metric=f"events.{body.event_type}",
    )
    return {
        "accepted": True,
        "tenant_id": body.tenant_id,
        "event_type": body.event_type,
        "integrity_status": "ok",
    }


@router.get("/runtime/federation")
async def runtime_federation() -> dict[str, Any]:
    return runtime_minimal_federation_engine_v1("federation")
