"""Top Movers runtime tests."""

from __future__ import annotations

from app.analytics_runtime.aggregators.engine import aggregate
from app.analytics_runtime.aggregators.top_movers import build_top_movers_mart, filter_top_movers
from app.analytics_runtime.runtime.engine import AnalyticsRuntimeEngine
from app.analytics_runtime.workers.sources import demo_snapshot


def test_materialize_includes_top_movers_mart():
    engine = AnalyticsRuntimeEngine()
    engine.bootstrap(demo_snapshot())
    payload = engine.providers.mart_payload("mart_top_movers")
    assert payload.get("top_gainers")
    assert engine.store.get("mart_marketplace")["empty"] is False
    assert engine.store.get("mart_product_metrics")["empty"] is False


def test_filter_top_movers_by_game_and_sort():
    engine = AnalyticsRuntimeEngine()
    engine.bootstrap(demo_snapshot())
    raw = engine.providers.mart_payload("mart_top_movers")
    filtered = filter_top_movers(raw, game="mtg", sort="volume", limit=10)
    assert filtered["sort"] == "volume"
    assert all(c["game"] == "mtg" for c in filtered["filtered"])


def test_build_top_movers_from_snapshot():
    snap = demo_snapshot()
    state = aggregate(snap)
    mart = build_top_movers_mart(state, snap)
    assert mart["top_gainers"][0]["delta_pct"] >= mart["top_losers"][0]["delta_pct"]
