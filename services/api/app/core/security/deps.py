"""Dependências FastAPI — auth e tenant."""

from __future__ import annotations

from typing import Any

from app.core.security.tenant import require_auth_tenant, resolve_auth
from fastapi import Header, HTTPException


def optional_auth(
    authorization: str | None = Header(default=None),
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
) -> dict[str, Any] | None:
    return resolve_auth(authorization, x_api_key)


def required_auth(
    authorization: str | None = Header(default=None),
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
) -> dict[str, Any]:
    auth = resolve_auth(authorization, x_api_key)
    if not auth:
        raise HTTPException(status_code=401, detail="Autenticação necessária")
    return auth


def tenant_scope(
    auth: dict[str, Any] | None = None,
    *,
    allow_anonymous: bool = False,
) -> str:
    return require_auth_tenant(auth, allow_anonymous=allow_anonymous)
