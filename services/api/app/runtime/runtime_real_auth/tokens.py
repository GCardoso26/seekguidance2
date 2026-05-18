"""Tokens estilo JWT com stdlib (HMAC-SHA256)."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
from typing import Any

_DEFAULT_SECRET = os.environ.get("RUNTIME_AUTH_SECRET", "tcg-runtime-dev-secret-change-me")
_TTL_ACCESS = int(os.environ.get("RUNTIME_ACCESS_TTL_SEC", "3600"))
_TTL_REFRESH = int(os.environ.get("RUNTIME_REFRESH_TTL_SEC", "86400"))


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(data: str) -> bytes:
    pad = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + pad)


def _sign(payload: dict[str, Any], secret: str) -> str:
    body = _b64url(json.dumps(payload, separators=(",", ":"), sort_keys=True).encode())
    sig = _b64url(hmac.new(secret.encode(), body.encode(), hashlib.sha256).digest())
    return f"{body}.{sig}"


def _verify(token: str, secret: str) -> dict[str, Any] | None:
    try:
        body, sig = token.rsplit(".", 1)
        expected = _b64url(hmac.new(secret.encode(), body.encode(), hashlib.sha256).digest())
        if not hmac.compare_digest(sig, expected):
            return None
        payload = json.loads(_b64url_decode(body))
        if float(payload.get("exp", 0)) < time.time():
            return None
        return payload
    except (ValueError, json.JSONDecodeError, KeyError):
        return None


def issue_tokens(user: dict[str, Any], *, secret: str | None = None) -> dict[str, str]:
    sec = secret or _DEFAULT_SECRET
    now = time.time()
    base = {
        "sub": user["id"],
        "username": user["username"],
        "role": user["role"],
        "tenant_id": user.get("tenant_id") or "default",
    }
    access = {**base, "typ": "access", "iat": now, "exp": now + _TTL_ACCESS}
    refresh = {**base, "typ": "refresh", "iat": now, "exp": now + _TTL_REFRESH}
    return {"access_token": _sign(access, sec), "refresh_token": _sign(refresh, sec)}


def refresh_access(refresh_token: str, *, secret: str | None = None) -> dict[str, str] | None:
    sec = secret or _DEFAULT_SECRET
    payload = _verify(refresh_token, sec)
    if not payload or payload.get("typ") != "refresh":
        return None
    user = {
        "id": payload["sub"],
        "username": payload["username"],
        "role": payload["role"],
        "tenant_id": payload.get("tenant_id", "default"),
    }
    return issue_tokens(user, secret=sec)


def decode_access(access_token: str, *, secret: str | None = None) -> dict[str, Any] | None:
    sec = secret or _DEFAULT_SECRET
    payload = _verify(access_token, sec)
    if not payload or payload.get("typ") != "access":
        return None
    return payload
