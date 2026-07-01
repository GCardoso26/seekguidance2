"""Testes de analytics públicos de vendedores."""

from datetime import UTC, datetime, timedelta

from app.marketplace.seller_analytics import (
    _activity_trend,
    compute_seller_badges,
)


def test_compute_badges_top_seller_and_power():
    badges = compute_seller_badges(
        total_sales=1200,
        sell_through_rate=0.75,
        fast_ship_pct=96.0,
        response_time_hours=2.0,
        verified=True,
        member_since=datetime.now(UTC) - timedelta(days=400),
    )
    ids = {b["id"] for b in badges}
    assert "top_seller" in ids
    assert "power_seller" in ids
    assert "fast_shipper" in ids
    assert "responsive" in ids
    assert "verified" in ids
    assert "new_seller" not in ids


def test_compute_badges_new_seller_only():
    badges = compute_seller_badges(
        total_sales=5,
        sell_through_rate=0.1,
        fast_ship_pct=0.0,
        response_time_hours=None,
        verified=False,
        member_since=datetime.now(UTC) - timedelta(days=10),
    )
    ids = {b["id"] for b in badges}
    assert ids == {"new_seller"}


def test_activity_trend_up_down_stable():
    assert _activity_trend(50, 40) == "up"
    assert _activity_trend(30, 50) == "down"
    assert _activity_trend(40, 40) == "stable"


def test_seller_analytics_cache_key_roundtrip(monkeypatch):
    from app.marketplace import seller_analytics_cache as cache

    stored: dict[str, str] = {}

    class FakeRedis:
        def get(self, key):
            return stored.get(key)

        def setex(self, key, ttl, value):
            stored[key] = value

    monkeypatch.setattr(cache, "_get_redis", lambda _url: FakeRedis())
    monkeypatch.setattr(
        cache,
        "get_settings",
        lambda: type("S", (), {"redis_url": "redis://local"})(),
    )

    payload = {"username": "cardseekers", "public_metrics": {"total_sales": 10}}
    cache.set_seller_analytics_cache("cardseekers", payload)
    got = cache.get_seller_analytics_cache("cardseekers")
    assert got is not None
    assert got["public_metrics"]["total_sales"] == 10
