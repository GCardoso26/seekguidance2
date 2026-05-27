"""Testes rate limit."""

from __future__ import annotations

from app.core.rate_limit import allow_request


def test_memory_rate_limit_blocks_over_limit() -> None:
    client = "test-client-1"
    for _ in range(3):
        assert allow_request("judge", client, limit=3, window_seconds=60.0, redis_url=None)
    assert not allow_request("judge", client, limit=3, window_seconds=60.0, redis_url=None)


def test_memory_rate_limit_allows_different_clients() -> None:
    assert allow_request("judge", "client-a", limit=1, window_seconds=60.0, redis_url=None)
    assert not allow_request("judge", "client-a", limit=1, window_seconds=60.0, redis_url=None)
    assert allow_request("judge", "client-b", limit=1, window_seconds=60.0, redis_url=None)
