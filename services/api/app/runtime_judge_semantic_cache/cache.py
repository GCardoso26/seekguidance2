"""Cache semântico: tcg:cache:{game_slug}:{embedding_hash} com similaridade coseno."""

from __future__ import annotations

import hashlib
import json
import math
import time
from dataclasses import dataclass
from typing import Any

import structlog

logger = structlog.get_logger(__name__)

_stats = {"hits": 0, "misses": 0, "stores": 0}


def cache_stats_snapshot() -> dict[str, Any]:
    total = _stats["hits"] + _stats["misses"]
    rate = (_stats["hits"] / total) if total else 0.0
    return {
        "hits": _stats["hits"],
        "misses": _stats["misses"],
        "stores": _stats["stores"],
        "cache_hit_rate": round(rate, 4),
        "integrity_status": "ok",
    }


def _cosine(a: list[float], b: list[float]) -> float:
    if len(a) != len(b) or not a:
        return 0.0
    dot = sum(x * y for x, y in zip(a, b, strict=True))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    if na <= 0 or nb <= 0:
        return 0.0
    return dot / (na * nb)


def _embedding_hash(embedding: list[float]) -> str:
    rounded = [round(v, 4) for v in embedding[:64]]
    payload = json.dumps(rounded, separators=(",", ":")).encode()
    return hashlib.sha256(payload).hexdigest()[:32]


@dataclass
class CachedEntry:
    embedding: list[float]
    response: dict[str, Any]
    created_at: float


class SemanticCache:
    def __init__(
        self,
        *,
        redis_url: str | None,
        ttl_seconds: int = 86_400,
        similarity_threshold: float = 0.97,
        enabled: bool = True,
    ) -> None:
        self._redis_url = redis_url
        self._ttl = max(60, int(ttl_seconds))
        self._threshold = float(similarity_threshold)
        self._enabled = enabled
        self._memory: dict[str, CachedEntry] = {}
        self._redis = None

    def _client(self):
        if self._redis is not None:
            return self._redis
        if not self._redis_url:
            return None
        try:
            import redis

            self._redis = redis.Redis.from_url(self._redis_url, decode_responses=True)
            self._redis.ping()
            return self._redis
        except Exception:
            self._redis = None
            return None

    def _key(self, game_slug: str, emb_hash: str) -> str:
        return f"tcg:cache:{game_slug}:{emb_hash}"

    def _index_key(self, game_slug: str) -> str:
        return f"tcg:cache:index:{game_slug}"

    async def lookup(
        self,
        game_slug: str,
        embedding: list[float],
    ) -> dict[str, Any] | None:
        if not self._enabled:
            return None
        emb_hash = _embedding_hash(embedding)
        key = self._key(game_slug, emb_hash)

        raw = None
        client = self._client()
        if client:
            try:
                raw = client.get(key)
            except Exception:
                raw = None
        if raw is None:
            entry = self._memory.get(key)
            if entry is None:
                _stats["misses"] += 1
                return None
            if _cosine(embedding, entry.embedding) >= self._threshold:
                _stats["hits"] += 1
                return entry.response
            _stats["misses"] += 1
            return None

        try:
            data = json.loads(raw)
            stored_emb = data.get("embedding") or []
            if _cosine(embedding, stored_emb) >= self._threshold:
                _stats["hits"] += 1
                return data.get("response")
        except Exception:
            logger.warning("semantic_cache.decode_failed", key=key)
        _stats["misses"] += 1
        return None

    async def store(
        self,
        game_slug: str,
        embedding: list[float],
        response: dict[str, Any],
    ) -> None:
        if not self._enabled:
            return
        emb_hash = _embedding_hash(embedding)
        key = self._key(game_slug, emb_hash)
        payload = json.dumps(
            {"embedding": embedding, "response": response, "created_at": time.time()},
            ensure_ascii=False,
        )
        entry = CachedEntry(embedding=embedding, response=response, created_at=time.time())
        self._memory[key] = entry
        _stats["stores"] += 1

        client = self._client()
        if client:
            try:
                client.setex(key, self._ttl, payload)
                client.sadd(self._index_key(game_slug), key)
                client.expire(self._index_key(game_slug), self._ttl)
            except Exception:
                logger.warning("semantic_cache.store_failed", game_slug=game_slug)

    def invalidate_game(self, game_slug: str) -> int:
        removed = 0
        prefix = f"tcg:cache:{game_slug}:"
        for k in list(self._memory.keys()):
            if k.startswith(prefix):
                del self._memory[k]
                removed += 1
        client = self._client()
        if client:
            try:
                index = self._index_key(game_slug)
                keys = list(client.smembers(index) or [])
                if keys:
                    client.delete(*keys)
                    removed += len(keys)
                client.delete(index)
                for k in client.scan_iter(match=f"{prefix}*"):
                    client.delete(k)
                    removed += 1
            except Exception:
                logger.warning("semantic_cache.invalidate_failed", game_slug=game_slug)
        return removed


_cache: SemanticCache | None = None


def get_semantic_cache(settings) -> SemanticCache:
    global _cache
    if _cache is None:
        _cache = SemanticCache(
            redis_url=getattr(settings, "redis_url", None),
            ttl_seconds=int(getattr(settings, "judge_semantic_cache_ttl_seconds", 86_400)),
            similarity_threshold=float(
                getattr(settings, "judge_semantic_cache_similarity", 0.97)
            ),
            enabled=bool(getattr(settings, "judge_semantic_cache_enabled", True)),
        )
    return _cache


def invalidate_game_cache(game_slug: str, settings) -> int:
    return get_semantic_cache(settings).invalidate_game(game_slug)


async def embed_question(settings, question: str) -> list[float]:
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY ausente")
    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    dim = settings.openai_embedding_dimensions
    resp = await client.embeddings.create(
        model=settings.default_embedding_model,
        input=[question],
        dimensions=dim,
    )
    return list(resp.data[0].embedding)
