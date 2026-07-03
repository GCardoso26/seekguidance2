"""Testes Sprint 6 — TCG API sync e cache Redis."""

from __future__ import annotations

import pytest
from app.catalog.redis_cache import _search_cache_key, redis_ping


def test_search_cache_key_stable():
    k1 = _search_cache_key(q="bolt", game="MTG", page=1)
    k2 = _search_cache_key(game="MTG", q="bolt", page=1)
    assert k1 == k2
    assert k1.startswith("tcg:search:")


def test_redis_ping_without_url(monkeypatch):
    class FakeSettings:
        redis_url = ""

    monkeypatch.setattr("app.catalog.redis_cache.get_settings", lambda: FakeSettings())
    assert redis_ping()["status"] == "unavailable"


@pytest.mark.asyncio
async def test_tcgapi_sync_skipped_without_key(monkeypatch):
    from app.pricing import tcgapi_sync

    class FakeSettings:
        tcg_api_key = None

    monkeypatch.setattr(tcgapi_sync, "get_settings", lambda: FakeSettings())

    class FakeSession:
        async def execute(self, *_a, **_k):
            raise AssertionError("should not query DB when key missing")

        async def commit(self):
            pass

    result = await tcgapi_sync.sync_tcgapi_prices(FakeSession(), game="MTG", limit=10)
    assert result["status"] == "skipped"
    assert result["ok"] is False
