"""Invalida cache semântico Judge após ingestão (Redis opcional)."""

from __future__ import annotations

import os


def invalidate_judge_semantic_cache(game_slug: str) -> int:
    url = os.environ.get("REDIS_URL")
    if not url:
        return 0
    try:
        import redis

        client = redis.Redis.from_url(url, decode_responses=True)
        removed = 0
        prefix = f"tcg:cache:{game_slug}:"
        for key in client.scan_iter(match=f"{prefix}*"):
            client.delete(key)
            removed += 1
        client.delete(f"tcg:cache:index:{game_slug}")
        return removed
    except Exception:
        return 0
