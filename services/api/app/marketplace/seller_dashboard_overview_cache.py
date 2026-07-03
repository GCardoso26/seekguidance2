"""Cache Redis para overview operacional do painel lojista."""

from __future__ import annotations

import json
from typing import Any

import structlog

from app.core.config import get_settings
from app.core.rate_limit import _get_redis

logger = structlog.get_logger(__name__)

DASHBOARD_OVERVIEW_TTL = 120  # 2 minutos


def _key(store_id: str) -> str:
    return f"tcg:dashboard:overview:{store_id.strip()}"


def get_dashboard_overview_cache(store_id: str) -> dict[str, Any] | None:
    settings = get_settings()
    client = _get_redis(settings.redis_url)
    if client is None:
        return None
    try:
        raw = client.get(_key(store_id))
        if not raw:
            return None
        data = json.loads(raw)
        return data if isinstance(data, dict) else None
    except Exception as exc:
        logger.warning("dashboard_overview_cache.get_failed", error=str(exc))
        return None


def set_dashboard_overview_cache(
    store_id: str,
    payload: dict[str, Any],
    *,
    ttl: int = DASHBOARD_OVERVIEW_TTL,
) -> None:
    settings = get_settings()
    client = _get_redis(settings.redis_url)
    if client is None:
        return
    try:
        client.setex(_key(store_id), ttl, json.dumps(payload, default=str))
    except Exception as exc:
        logger.warning("dashboard_overview_cache.set_failed", error=str(exc))
