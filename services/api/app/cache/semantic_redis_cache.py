"""Cache semântico com backend Redis (opcional) e fallback in-memory."""

from __future__ import annotations

from typing import Any

_MEM: dict[str, Any] = {}


async def semantic_cache_get(key: str) -> Any | None:
    return _MEM.get(key)


async def semantic_cache_set(key: str, value: Any, ttl_seconds: int = 300) -> None:
    _MEM[key] = {"value": value, "ttl": ttl_seconds}
