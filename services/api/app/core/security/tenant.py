"""Isolamento de tenant — tenant_id só a partir de credenciais válidas."""

from __future__ import annotations

from typing import Any

from app.core.security.rbac import assert_tenant_access
from app.runtime.runtime_real_auth import tokens
from app.runtime.runtime_real_auth.engine import runtime_real_auth_engine_v1
from fastapi import HTTPException


def resolve_auth(
    authorization: str | None,
    x_api_key: str | None,
    *,
    storage_path: str | None = None,
) -> dict[str, Any] | None:
    if x_api_key:
        r = runtime_real_auth_engine_v1(
            "auth",
            action="api_key",
            api_key=x_api_key,
            storage_path=storage_path,
        )
        if r.get("authenticated"):
            ku = r.get("api_key") or {}
            return {
                "user_id": ku.get("key_id"),
                "username": ku.get("label") or "api_key",
                "role": ku.get("role", "viewer"),
                "tenant_id": ku.get("tenant_id", "default"),
            }
    if authorization and authorization.lower().startswith("bearer "):
        tok = authorization.split(" ", 1)[1].strip()
        payload = tokens.decode_access(tok)
        if payload:
            return {
                "user_id": payload.get("sub"),
                "username": payload.get("username"),
                "role": payload.get("role", "viewer"),
                "tenant_id": payload.get("tenant_id", "default"),
            }
    return None


def tenant_from_auth(auth: dict[str, Any] | None, *, default: str = "default") -> str:
    if not auth:
        return default
    return str(auth.get("tenant_id") or default)


def require_auth_tenant(
    auth: dict[str, Any] | None,
    *,
    allow_anonymous: bool = False,
) -> str:
    """Tenant efectivo = sempre o do token/API key (ignora query/body)."""
    if not auth:
        if allow_anonymous:
            return "default"
        raise HTTPException(status_code=401, detail="Autenticação necessária")
    return tenant_from_auth(auth)


def check_tenant_access(auth: dict[str, Any], resource_tenant: str) -> None:
    auth_tenant = tenant_from_auth(auth)
    if not assert_tenant_access(auth_tenant, resource_tenant, role=str(auth.get("role", "viewer"))):
        raise HTTPException(status_code=403, detail="Acesso negado a este tenant")
