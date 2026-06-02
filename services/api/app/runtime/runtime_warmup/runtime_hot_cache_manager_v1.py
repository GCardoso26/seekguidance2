"""Gestão de cache quente (semantic cache + config)."""

from __future__ import annotations

from typing import Any

import structlog

logger = structlog.get_logger(__name__)

_hot_cache: dict[str, Any] = {"ready": False, "semantic_cache": False, "redis": False}


def mark_cache_ready(*, semantic: bool = False, redis: bool = False) -> None:
    if semantic:
        _hot_cache["semantic_cache"] = True
    if redis:
        _hot_cache["redis"] = True
    _hot_cache["ready"] = bool(_hot_cache.get("semantic_cache"))


def cache_status() -> dict[str, Any]:
    return dict(_hot_cache)


async def warm_semantic_cache(settings) -> bool:
    try:
        from app.runtime_judge_semantic_cache.cache import get_semantic_cache

        cache = get_semantic_cache(settings)
        _ = cache
        mark_cache_ready(semantic=True)
        return True
    except Exception as exc:
        logger.warning("warmup_semantic_cache_failed", error=str(exc))
        return False
