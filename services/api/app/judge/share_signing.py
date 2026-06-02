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


def verify_share_signature(
    share_id: str,
    signature: str | None,
    secret: str | None,
    *,
    previous_secret: str | None = None,
) -> bool:
    if not secret and not previous_secret:
        return True
    if not signature:
        return not secret and not previous_secret
    sig = signature.strip().lower()
    for sec in (secret, previous_secret):
        if not sec:
            continue
        expected = sign_share_id(share_id, sec)
        if expected and secrets.compare_digest(expected, sig):
            return True
    return False


def is_valid_uuid(value: str) -> bool:
    try:
        UUID(value)
        return True
    except (ValueError, AttributeError):
        return False
