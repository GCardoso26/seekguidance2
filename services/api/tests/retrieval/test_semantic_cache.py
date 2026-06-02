"""Testes do cache semântico hash (Wave 2A)."""

from __future__ import annotations

import pytest

from app.retrieval.semantic_cache import (
    _model_slug,
    _normalize_question,
    cache_key,
    get_cached_response,
    invalidate_game_cache,
    set_cached_response,
)


def test_normalize_strips_punctuation():
    assert _normalize_question("Como funciona Trample?") == _normalize_question(
        "Como funciona Trample"
    )


def test_reordered_words_different_keys():
    k1 = cache_key("mtg", "text-embedding-3-large", "como funciona trample")
    k2 = cache_key("mtg", "text-embedding-3-large", "trample como funciona")
    assert k1 != k2


def test_different_model_different_key():
    k1 = cache_key("mtg", "text-embedding-3-large", "trample")
    k2 = cache_key("mtg", "text-embedding-3-small", "trample")
    assert k1 != k2
    assert _model_slug("text-embedding-3-large") != _model_slug("text-embedding-3-small")


@pytest.mark.asyncio
async def test_redis_unavailable_returns_none():
    out = await get_cached_response(None, "mtg", "trample?", "text-embedding-3-large")
    assert out is None


class _FakeRedis:
    def __init__(self):
        self.store: dict[str, str] = {}

    def get(self, key):
        return self.store.get(key)

    def setex(self, key, _ttl, value):
        self.store[key] = value

    def scan_iter(self, match="*"):
        prefix = match.replace("*", "")
        for k in list(self.store.keys()):
            if k.startswith(prefix.rstrip("*")):
                yield k

    def delete(self, *keys):
        for k in keys:
            self.store.pop(k, None)


@pytest.mark.asyncio
async def test_invalidation_clears_cache():
    redis = _FakeRedis()
    await set_cached_response(
        redis, "mtg", "trample?", "text-embedding-3-large", {"answer": "ok"}
    )
    key = cache_key("mtg", "text-embedding-3-large", "trample?")
    assert redis.store.get(key)
    removed = await invalidate_game_cache(redis, "mtg", "text-embedding-3-large")
    assert removed >= 1
    out = await get_cached_response(redis, "mtg", "trample?", "text-embedding-3-large")
    assert out is None
