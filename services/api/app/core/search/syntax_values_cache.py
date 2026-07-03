"""Cache Redis para autocomplete de valores de syntax search."""

from __future__ import annotations

import json
from typing import Any

import structlog
from app.core.config import get_settings
from app.core.rate_limit import _get_redis

logger = structlog.get_logger(__name__)

SYNTAX_VALUES_TTL = 3600  # 1 hora


def _key(game: str, field: str, query: str) -> str:
    q = query.strip().lower()[:80]
    return f"tcg:syntax_values:{game.lower()}:{field.lower()}:{q}"


def get_syntax_values_cache(game: str, field: str, query: str) -> dict[str, Any] | None:
    settings = get_settings()
    client = _get_redis(settings.redis_url)
    if client is None:
        return None
    try:
        raw = client.get(_key(game, field, query))
        if not raw:
            return None
        data = json.loads(raw)
        return data if isinstance(data, dict) else None
    except Exception as exc:
        logger.warning("syntax_values_cache.get_failed", error=str(exc))
        return None


def set_syntax_values_cache(
    game: str, field: str, query: str, payload: dict[str, Any], *, ttl: int = SYNTAX_VALUES_TTL
) -> None:
    settings = get_settings()
    client = _get_redis(settings.redis_url)
    if client is None:
        return
    try:
        client.setex(_key(game, field, query), ttl, json.dumps(payload, default=str))
    except Exception as exc:
        logger.warning("syntax_values_cache.set_failed", error=str(exc))
