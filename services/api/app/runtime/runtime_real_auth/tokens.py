"""Tokens JWT (HMAC-SHA256) com expiração curta, rotação e revogação."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
import time
import uuid
from typing import Any

from app.core.config import get_settings
from app.core.security.token_revocation import is_revoked, revoke_jti

_ACCESS_TTL = 900  # 15 min — sobrescrito por config
_REFRESH_TTL = 86400


def _settings_secret() -> str:
    cfg = get_settings()
    secret = (cfg.runtime_auth_secret or "").strip()
    if cfg.environment == "production" and len(secret) < 32:
        raise RuntimeError("RUNTIME_AUTH_SECRET must be at least 32 characters in production")
    if not secret:
        if cfg.environment == "production":
            raise RuntimeError("RUNTIME_AUTH_SECRET is required in production")
        return "dev-only-insecure-secret-do-not-use-in-prod"
    return secret


def _access_ttl() -> int:
    return int(get_settings().runtime_access_ttl_sec)


def _refresh_ttl() -> int:
    return int(get_settings().runtime_refresh_ttl_sec)


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(data: str) -> bytes:
    pad = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + pad)


def _sign(payload: dict[str, Any], secret: str) -> str:
    body = _b64url(json.dumps(payload, separators=(",", ":"), sort_keys=True).encode())
    sig = _b64url(hmac.new(secret.encode(), body.encode(), hashlib.sha256).digest())
    return f"{body}.{sig}"


def _verify(token: str, secret: str, *, expected_typ: str | None = None) -> dict[str, Any] | None:
    try:
        body, sig = token.rsplit(".", 1)
        expected_sig = _b64url(hmac.new(secret.encode(), body.encode(), hashlib.sha256).digest())
        if not hmac.compare_digest(sig, expected_sig):
            return None
        payload = json.loads(_b64url_decode(body))
        if float(payload.get("exp", 0)) < time.time():
            return None
        if expected_typ and payload.get("typ") != expected_typ:
            return None
        jti = payload.get("jti")
        if jti and is_revoked(str(jti), redis_url=get_settings().redis_url):
            return None
        return payload
    except (ValueError, json.JSONDecodeError, KeyError):
        return None


def issue_tokens(user: dict[str, Any], *, secret: str | None = None) -> dict[str, str]:
    sec = secret or _settings_secret()
    now = time.time()
    base = {
        "sub": user["id"],
        "username": user["username"],
        "role": user["role"],
        "tenant_id": user.get("tenant_id") or "default",
    }
    access = {
        **base,
        "typ": "access",
        "iat": now,
        "exp": now + _access_ttl(),
        "jti": secrets.token_urlsafe(16),
    }
    refresh = {
        **base,
        "typ": "refresh",
        "iat": now,
        "exp": now + _refresh_ttl(),
        "jti": secrets.token_urlsafe(16),
        "family": str(uuid.uuid4()),
    }
    return {"access_token": _sign(access, sec), "refresh_token": _sign(refresh, sec)}


def refresh_access(
    refresh_token: str,
    *,
    secret: str | None = None,
    storage_path: str | None = None,
) -> dict[str, str] | None:
    sec = secret or _settings_secret()
    payload = _verify(refresh_token, sec, expected_typ="refresh")
    if not payload:
        return None

    cfg = get_settings()
    revoke_jti(str(payload["jti"]), exp_epoch=float(payload["exp"]), redis_url=cfg.redis_url)

    from app.runtime.runtime_real_auth import store

    user = store.get_user_by_id(str(payload["sub"]), storage_path=storage_path)
    if not user:
        user = {
            "id": payload["sub"],
            "username": payload["username"],
            "role": payload["role"],
            "tenant_id": payload.get("tenant_id", "default"),
        }
    return issue_tokens(user, secret=sec)


def decode_access(access_token: str, *, secret: str | None = None) -> dict[str, Any] | None:
    sec = secret or _settings_secret()
    return _verify(access_token, sec, expected_typ="access")


def revoke_token(token: str, *, secret: str | None = None) -> bool:
    sec = secret or _settings_secret()
    try:
        body, _ = token.rsplit(".", 1)
        payload = json.loads(_b64url_decode(body))
    except (ValueError, json.JSONDecodeError):
        return False
    jti = payload.get("jti")
    exp = float(payload.get("exp", 0))
    if not jti or exp <= time.time():
        return False
    revoke_jti(str(jti), exp_epoch=exp, redis_url=get_settings().redis_url)
    return True
