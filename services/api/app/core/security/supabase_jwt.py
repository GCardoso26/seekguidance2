"""Validação de access tokens JWT do Supabase Auth (HS256 legado + ES256/RS256 via JWKS)."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time
from functools import lru_cache
from typing import Any

import jwt
import structlog
from jwt import PyJWKClient
from jwt.exceptions import PyJWTError

logger = structlog.get_logger(__name__)

_JWKS_ALGORITHMS = ("ES256", "RS256")


def _b64url_decode(data: str) -> bytes:
    pad = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + pad)


def _jwt_header(token: str) -> dict[str, Any] | None:
    if not token or token.count(".") != 2:
        return None
    try:
        header_b64 = token.split(".", 1)[0]
        return json.loads(_b64url_decode(header_b64))
    except (ValueError, json.JSONDecodeError):
        return None


def _verify_hs256(token: str, secret: str) -> dict[str, Any] | None:
    secret = secret.strip()
    if not secret:
        return None

    try:
        header_b64, payload_b64, sig_b64 = token.split(".", 2)
        signing_input = f"{header_b64}.{payload_b64}".encode()
        expected = base64.urlsafe_b64encode(
            hmac.new(secret.encode(), signing_input, hashlib.sha256).digest()
        ).rstrip(b"=").decode()
        if not hmac.compare_digest(expected, sig_b64):
            return None

        header = json.loads(_b64url_decode(header_b64))
        if header.get("alg") not in (None, "HS256"):
            return None

        payload = json.loads(_b64url_decode(payload_b64))
        exp = payload.get("exp")
        if exp is not None and float(exp) < time.time():
            return None

        sub = payload.get("sub")
        if not sub or not str(sub).strip():
            return None

        return payload
    except (ValueError, json.JSONDecodeError, TypeError) as exc:
        logger.debug("supabase_jwt_hs256_invalid", error=str(exc))
        return None


@lru_cache(maxsize=4)
def _jwks_client(jwks_url: str) -> PyJWKClient:
    return PyJWKClient(jwks_url, cache_keys=True, lifespan=3600)


def _jwks_url(supabase_url: str) -> str:
    return f"{supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"


def _verify_jwks(token: str, supabase_url: str) -> dict[str, Any] | None:
    header = _jwt_header(token)
    if not header:
        return None

    alg = str(header.get("alg") or "").upper()
    if alg not in _JWKS_ALGORITHMS:
        return None

    try:
        client = _jwks_client(_jwks_url(supabase_url))
        signing_key = client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=[alg],
            options={"verify_aud": False},
        )
        sub = payload.get("sub")
        if not sub or not str(sub).strip():
            return None
        return payload
    except PyJWTError as exc:
        logger.debug("supabase_jwt_jwks_invalid", error=str(exc), alg=alg)
        return None


def verify_supabase_access_token(
    token: str,
    secret: str | None = None,
    *,
    supabase_url: str | None = None,
) -> dict[str, Any] | None:
    """Retorna payload JWT se assinatura e expiração forem válidas."""
    token = (token or "").strip()
    if not token:
        return None

    header = _jwt_header(token)
    if not header:
        return None

    alg = str(header.get("alg") or "HS256").upper()
    url = (supabase_url or "").strip() or None
    hs_secret = (secret or "").strip() or None

    if alg in _JWKS_ALGORITHMS and url:
        payload = _verify_jwks(token, url)
        if payload:
            return payload

    if hs_secret:
        return _verify_hs256(token, hs_secret)

    return None
