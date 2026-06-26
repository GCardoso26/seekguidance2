"""Validação de access tokens JWT do Supabase Auth (HS256)."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time
from typing import Any

import structlog

logger = structlog.get_logger(__name__)


def _b64url_decode(data: str) -> bytes:
    pad = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + pad)


def verify_supabase_access_token(token: str, secret: str) -> dict[str, Any] | None:
    """Retorna payload JWT se assinatura e expiração forem válidas."""
    secret = secret.strip()
    if not secret or not token or token.count(".") != 2:
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
        logger.debug("supabase_jwt_invalid", error=str(exc))
        return None
