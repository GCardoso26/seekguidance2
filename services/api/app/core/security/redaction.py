"""Redacção de dados sensíveis em logs, traces e exports."""

from __future__ import annotations

import re
from typing import Any

_SENSITIVE_KEYS = frozenset(
    {
        "password",
        "passwd",
        "secret",
        "token",
        "access_token",
        "refresh_token",
        "authorization",
        "api_key",
        "x-api-key",
        "openai_api_key",
        "database_url",
        "redis_url",
        "cookie",
        "set-cookie",
        "credential",
        "private_key",
        "session",
    }
)

_EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
_BEARER_RE = re.compile(r"\bBearer\s+[A-Za-z0-9._~+/=-]+\b", re.I)
_JWT_RE = re.compile(r"\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b")
_PG_URL_RE = re.compile(r"(postgresql(?:\+asyncpg)?://)[^@\s]+@", re.I)
_SK_RE = re.compile(r"\bsk-[A-Za-z0-9]{16,}\b")


def mask_string(value: str, *, max_visible: int = 4) -> str:
    if not value:
        return value
    out = value
    out = _BEARER_RE.sub("Bearer [REDACTED]", out)
    out = _JWT_RE.sub("[REDACTED_JWT]", out)
    out = _PG_URL_RE.sub(r"\1[REDACTED]@", out)
    out = _SK_RE.sub("[REDACTED_KEY]", out)
    out = _EMAIL_RE.sub(lambda m: _mask_email(m.group(0)), out)
    if len(out) <= max_visible * 2:
        return "***"
    return f"{out[:max_visible]}…{out[-max_visible:]}" if len(out) > max_visible * 2 else "***"


def _mask_email(email: str) -> str:
    local, _, domain = email.partition("@")
    if not domain:
        return "***@***"
    local_mask = (local[0] + "***") if local else "***"
    return f"{local_mask}@{domain}"


def mask_mapping(data: Any, *, depth: int = 0, max_depth: int = 12) -> Any:
    if depth > max_depth:
        return "[TRUNCATED]"
    if isinstance(data, dict):
        out: dict[str, Any] = {}
        for key, val in data.items():
            key_l = str(key).lower()
            if key_l in _SENSITIVE_KEYS or key_l.endswith("_token") or key_l.endswith("_secret"):
                out[key] = "[REDACTED]"
            else:
                out[key] = mask_mapping(val, depth=depth + 1, max_depth=max_depth)
        return out
    if isinstance(data, list):
        return [mask_mapping(item, depth=depth + 1, max_depth=max_depth) for item in data[:50]]
    if isinstance(data, tuple):
        return tuple(mask_mapping(list(data), depth=depth + 1, max_depth=max_depth))
    if isinstance(data, str):
        return mask_string(data)
    return data


def sanitize_exception_message(exc: BaseException) -> str:
    return mask_string(str(exc) or exc.__class__.__name__)
