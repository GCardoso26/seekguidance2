"""Revogação e rotação de refresh tokens (Redis + memória)."""

from __future__ import annotations

import time
from collections import defaultdict

_memory_revoked: dict[str, float] = defaultdict(float)
_redis = None


def _redis_client(redis_url: str | None):
    global _redis
    if _redis is not None:
        return _redis
    if not redis_url:
        return None
    try:
        import redis

        _redis = redis.Redis.from_url(redis_url, decode_responses=True)
        _redis.ping()
        return _redis
    except Exception:
        _redis = None
        return None


def revoke_jti(jti: str, *, exp_epoch: float, redis_url: str | None = None) -> None:
    ttl = max(1, int(exp_epoch - time.time()))
    client = _redis_client(redis_url)
    if client:
        try:
            client.setex(f"tcg:revoked:{jti}", ttl, "1")
            return
        except Exception:
            pass
    _memory_revoked[jti] = exp_epoch


def is_revoked(jti: str, *, redis_url: str | None = None) -> bool:
    client = _redis_client(redis_url)
    if client:
        try:
            return bool(client.get(f"tcg:revoked:{jti}"))
        except Exception:
            pass
    exp = _memory_revoked.get(jti)
    if not exp:
        return False
    if exp < time.time():
        del _memory_revoked[jti]
        return False
    return True
