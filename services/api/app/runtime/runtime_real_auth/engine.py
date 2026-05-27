"""runtime_real_auth_engine_v1 — auth funcional minimal."""

from __future__ import annotations

from typing import Any

from app.runtime.runtime_real_auth import store, tokens


def runtime_real_auth_engine_v1(
    scope: str,
    *,
    storage_path: str | None = None,
    action: str = "status",
    username: str | None = None,
    password: str | None = None,
    refresh_token: str | None = None,
    access_token: str | None = None,
    api_key: str | None = None,
) -> dict[str, Any]:
    store.init_db(storage_path)
    store.ensure_default_admin(storage_path)

    if action == "login" and username and password:
        user = store.verify_user(username, password, storage_path=storage_path)
        if not user:
            return _fail(scope, "invalid_credentials")
        tok = tokens.issue_tokens(user)
        return _ok(
            scope,
            {
                "authenticated": True,
                "user": {"username": user["username"], "role": user["role"]},
                "tokens": tok,
                "rbac": _rbac(user["role"]),
            },
        )

    if action == "refresh" and refresh_token:
        tok = tokens.refresh_access(refresh_token, storage_path=storage_path)
        if not tok:
            return _fail(scope, "invalid_refresh_token")
        return _ok(scope, {"refreshed": True, "tokens": tok})

    if action == "revoke" and (access_token or refresh_token):
        revoked = tokens.revoke_token(access_token or refresh_token or "")
        return _ok(scope, {"revoked": revoked})

    if action == "api_key" and api_key:
        key_user = store.verify_api_key(api_key, storage_path=storage_path)
        if not key_user:
            return _fail(scope, "invalid_api_key")
        return _ok(
            scope,
            {"authenticated": True, "api_key": key_user, "rbac": _rbac(key_user["role"])},
        )

    return _ok(
        scope,
        {
            "auth_ready": True,
            "modes": ["jwt", "api_key", "session"],
            "roles": ["admin", "operator", "viewer"],
            "default_admin": "disabled in production unless RUNTIME_DEFAULT_ADMIN_PASSWORD is set",
        },
    )


def _rbac(role: str) -> dict[str, bool]:
    perms = {
        "admin": {"read": True, "write": True, "replay": True, "tenant_admin": True},
        "operator": {"read": True, "write": True, "replay": True, "tenant_admin": False},
        "viewer": {"read": True, "write": False, "replay": False, "tenant_admin": False},
    }
    return perms.get(role, perms["viewer"])


def _ok(scope: str, extra: dict[str, Any]) -> dict[str, Any]:
    return {
        "scope": scope,
        "assistant_notes": ["runtime_real_auth_engine_v1: auth funcional."],
        "deterministic_alignment": {"token": f"auth-{scope}"},
        "runtime_confidence": 0.94,
        "replay_summary": {},
        "lineage_summary": {},
        "divergence_summary": {},
        "governance_summary": {},
        "lifecycle_summary": {},
        "operational_notes": [],
        "integrity_status": "ok",
        **extra,
    }


def _fail(scope: str, code: str) -> dict[str, Any]:
    out = _ok(scope, {"authenticated": False, "error": code})
    out["integrity_status"] = "degraded"
    out["runtime_confidence"] = 0.94
    return out
