"""Assinatura HMAC para links de partilha de vereditos."""

from __future__ import annotations

import hashlib
import hmac
import secrets
from uuid import UUID


def sign_share_id(share_id: str, secret: str | None) -> str | None:
    if not secret:
        return None
    digest = hmac.new(secret.encode("utf-8"), share_id.encode("utf-8"), hashlib.sha256).hexdigest()
    return digest[:32]


def verify_share_signature(share_id: str, signature: str | None, secret: str | None) -> bool:
    if not secret or not signature:
        return not secret
    expected = sign_share_id(share_id, secret)
    if not expected:
        return False
    return secrets.compare_digest(expected, signature.strip().lower())


def is_valid_uuid(value: str) -> bool:
    try:
        UUID(value)
        return True
    except (ValueError, AttributeError):
        return False
