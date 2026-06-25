"""Cache Redis opcional para buscas de catálogo (Upstash / Redis URL)."""

from __future__ import annotations

import hashlib
import json
from typing import Any

import structlog

from app.core.config import get_settings
from app.core.rate_limit import _get_redis

logger = structlog.get_logger(__name__)

SEARCH_CACHE_TTL = 120


def _search_cache_key(**params: Any) -> str:
    raw = json.dumps(params, sort_keys=True, default=str)
    digest = hashlib.sha256(raw.encode()).hexdigest()[:24]
    return f"tcg:search:{digest}"


def get_search_cache(**params: Any) -> dict[str, Any] | None:
    settings = get_settings()
    client = _get_redis(settings.redis_url)
    if client is None:
        return None
    key = _search_cache_key(**params)
    try:
        raw = client.get(key)
        if not raw:
            return None
        data = json.loads(raw)
        return data if isinstance(data, dict) else None
    except Exception as exc:
        logger.warning("redis_cache.get_failed", error=str(exc))
        return None


def set_search_cache(result: dict[str, Any], *, ttl: int = SEARCH_CACHE_TTL, **params: Any) -> None:
    settings = get_settings()
    client = _get_redis(settings.redis_url)
    if client is None:
        return
    key = _search_cache_key(**params)
    try:
        client.setex(key, ttl, json.dumps(result, default=str))
    except Exception as exc:
        logger.warning("redis_cache.set_failed", error=str(exc))


def redis_ping() -> dict[str, Any]:
    settings = get_settings()
    client = _get_redis(settings.redis_url)
    if client is None:
        return {"status": "unavailable", "configured": bool(settings.redis_url)}
    try:
        client.ping()
        return {"status": "ok", "configured": True}
    except Exception as exc:
        return {"status": "error", "configured": True, "error": str(exc)}
