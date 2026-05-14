"""Integridade de payloads de replay (assinatura opcional)."""

from __future__ import annotations

import hashlib
import hmac
import json
from typing import Any


def canonical_json_bytes(payload: dict[str, Any]) -> bytes:
    return json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")


def sign_replay_payload(payload: dict[str, Any], secret: str) -> str:
    digest = hmac.new(secret.encode("utf-8"), canonical_json_bytes(payload), hashlib.sha256).hexdigest()
    return digest


def verify_replay_payload(payload: dict[str, Any], secret: str, signature: str) -> bool:
    return hmac.compare_digest(sign_replay_payload(payload, secret), signature)
