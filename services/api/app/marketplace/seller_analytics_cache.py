"""Cache Redis para analytics públicos de vendedores."""

from __future__ import annotations

import json
from typing import Any

import structlog

from app.core.config import get_settings
from app.core.rate_limit import _get_redis

logger = structlog.get_logger(__name__)

SELLER_ANALYTICS_TTL = 300  # 5 minutos


def _key(username: str) -> str:
    return f"tcg:seller_analytics:{username.strip().lower()}"


def get_seller_analytics_cache(username: str) -> dict[str, Any] | None:
    settings = get_settings()
    client = _get_redis(settings.redis_url)
    if client is None:
        return None
    try:
        raw = client.get(_key(username))
        if not raw:
            return None
        data = json.loads(raw)
        return data if isinstance(data, dict) else None
    except Exception as exc:
        logger.warning("seller_analytics_cache.get_failed", error=str(exc))
        return None


def set_seller_analytics_cache(username: str, payload: dict[str, Any], *, ttl: int = SELLER_ANALYTICS_TTL) -> None:
    settings = get_settings()
    client = _get_redis(settings.redis_url)
    if client is None:
        return
    try:
        client.setex(_key(username), ttl, json.dumps(payload, default=str))
    except Exception as exc:
        logger.warning("seller_analytics_cache.set_failed", error=str(exc))
