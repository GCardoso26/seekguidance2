"""Autorização para operações de sync do catálogo."""

from __future__ import annotations

from fastapi import Header, HTTPException

from app.core.security.tenant import resolve_auth


def require_catalog_sync_auth(
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
    authorization: str | None = Header(default=None),
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
) -> None:
    """Console admin/operator (JWT ou API key) ou utilizador Supabase autenticado."""
    auth = resolve_auth(authorization, x_api_key)
    if auth and str(auth.get("role")) in ("admin", "operator"):
        return
    if x_judge_user_id and x_judge_user_id.strip():
        return
    raise HTTPException(status_code=401, detail="Autenticação necessária")
