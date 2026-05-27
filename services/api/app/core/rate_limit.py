"""Rate limiting — memória local com fallback opcional Redis."""

from __future__ import annotations

import time
from collections import defaultdict
from collections.abc import Callable

import structlog

logger = structlog.get_logger(__name__)

_memory: dict[str, list[float]] = defaultdict(list)
_redis_client: object | None = None


def _get_redis(redis_url: str | None):
    global _redis_client
    if _redis_client is not None:
        return _redis_client
    if not redis_url:
        return None
    try:
        import redis

        _redis_client = redis.Redis.from_url(redis_url, decode_responses=True)
        _redis_client.ping()
        logger.info("rate_limit.redis_connected")
        return _redis_client
    except Exception as exc:
        logger.warning("rate_limit.redis_unavailable", error=str(exc))
        _redis_client = None
        return None


def client_key(request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def _memory_check(key: str, *, limit: int, window: float) -> bool:
    now = time.monotonic()
    window_start = now - window
    hits = _memory[key]
    while hits and hits[0] < window_start:
        hits.pop(0)
    if len(hits) >= limit:
        return False
    hits.append(now)
    return True


def _redis_check(key: str, *, limit: int, window: int, redis_url: str | None) -> bool | None:
    client = _get_redis(redis_url)
    if client is None:
        return None
    try:
        pipe = client.pipeline()
        pipe.incr(key)
        pipe.expire(key, window)
        count, _ = pipe.execute()
        return int(count) <= limit
    except Exception as exc:
        logger.warning("rate_limit.redis_error", error=str(exc))
        return None


def allow_request(
    bucket: str,
    client: str,
    *,
    limit: int,
    window_seconds: float,
    redis_url: str | None = None,
) -> bool:
    if limit <= 0:
        return True
    key = f"tcg:rl:{bucket}:{client}"
    window_int = max(1, int(window_seconds))
    redis_ok = _redis_check(key, limit=limit, window=window_int, redis_url=redis_url)
    if redis_ok is not None:
        return redis_ok
    return _memory_check(f"{bucket}:{client}", limit=limit, window=window_seconds)


def build_rate_limit_response():
    from fastapi import Response

    return Response(
        status_code=429,
        content='{"detail":"Muitas consultas em pouco tempo. Aguarde um momento."}',
        media_type="application/json",
        headers={"Retry-After": "60"},
    )
