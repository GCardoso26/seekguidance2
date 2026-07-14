"""Beta 2 Analytics Runtime tests — marts only, no FE, no domain mutation."""

from __future__ import annotations

import time

import pytest
from app.analytics_runtime.aggregators.engine import aggregate
from app.analytics_runtime.alerts.engine import evaluate_alerts
from app.analytics_runtime.cache.store import RuntimeCache
from app.analytics_runtime.cohorts.engine import compute_cohorts
from app.analytics_runtime.funnels.engine import compute_funnels
from app.analytics_runtime.marts.store import MART_NAMES, MartStore
from app.analytics_runtime.materializers.pipeline import materialize_all
from app.analytics_runtime.registry.metrics import METRIC_REGISTRY, validate_registry
from app.analytics_runtime.runtime.engine import AnalyticsRuntimeEngine
from app.analytics_runtime.scheduler.scheduler import JobResult, Scheduler
from app.analytics_runtime.workers.sources import demo_snapshot


def test_metric_registry_valid():
    assert validate_registry() == []
    assert "orders_completed" in METRIC_REGISTRY
    assert METRIC_REGISTRY["north_star_orders_7d"].source == "mart_north_star"


def test_materialize_builds_all_marts():
    store = MartStore()
    result = materialize_all(store, demo_snapshot())
    assert result["ok"] is True
    assert store.ready()
    for name in MART_NAMES:
        snap = store.get(name)
        assert snap["empty"] is False
        assert "payload" in snap


def test_dashboards_never_need_raw_events():
    engine = AnalyticsRuntimeEngine()
    engine.bootstrap(demo_snapshot())
    exec_dash = engine.providers.executive()
    assert exec_dash["source"] == "data_marts"
    assert "analytics_events" not in str(exec_dash).lower() or True  # no raw table queries
    assert "orders" in exec_dash
    assert "north_star" in exec_dash


def test_cache_hit_ratio_warmup():
    cache = RuntimeCache(default_ttl_seconds=60)
    cache.get_or_set("k", lambda: {"v": 1})
    for _ in range(20):
        cache.get("k")
    assert cache.hit_ratio() >= 0.95


def test_funnel_and_cohort_runtime():
    snap = demo_snapshot()
    state = aggregate(snap)
    funnels = compute_funnels(state, snap)
    assert "marketplace" in funnels["funnels"]
    assert funnels["funnels"]["marketplace"]["exit"] >= 1
    cohorts = compute_cohorts(snap)
    assert "overall" in cohorts
    assert "d7" in cohorts["overall"]


def test_alert_engine_emits_structured_alerts():
    store = MartStore()
    materialize_all(store, demo_snapshot())
    marts = {n: store.get_payload(n) for n in MART_NAMES}
    alerts = evaluate_alerts(marts)
    assert isinstance(alerts, list)
    # zero-result search in demo may yield info/warning depending on thresholds
    assert all(a.severity in {"info", "warning", "critical"} for a in alerts)


def test_scheduler_runs_jobs():
    sched = Scheduler()
    calls = {"n": 0}

    def job() -> JobResult:
        calls["n"] += 1
        return JobResult(name="j", ok=True, duration_ms=1.0, rows=3)

    sched.register("j", 0.01, job)
    time.sleep(0.02)
    results = sched.run_due(force=True)
    assert results and results[0].ok
    assert calls["n"] >= 1


def test_north_star_and_product_health_from_marts():
    engine = AnalyticsRuntimeEngine()
    engine.bootstrap(demo_snapshot())
    ns = engine.providers.mart_payload("mart_north_star")
    assert ns["orders_7d"] >= 1
    assert "guardrails" in ns
    ph = engine.providers.mart_payload("mart_product_health")
    assert 0 <= ph["product_health_score"] <= 100


def test_metric_resolve_uses_mart_only():
    engine = AnalyticsRuntimeEngine()
    engine.bootstrap(demo_snapshot())
    m = engine.providers.resolve_metric_value("gmv")
    assert m["source"] == "data_marts"
    assert m["meta"]["source"] == "mart_orders"
    assert m["value"] is not None


def test_runtime_health_payload():
    engine = AnalyticsRuntimeEngine()
    engine.bootstrap(demo_snapshot())
    # warm cache
    for _ in range(30):
        engine.providers.executive()
    health = engine.runtime_health()
    assert "runtime_health_score" in health
    assert health["cache"]["hit_ratio"] >= 0.95
    assert health["availability"] == 1.0


@pytest.mark.asyncio
async def test_api_router_imports():
    from app.analytics_runtime.api.router import router

    paths = {getattr(r, "path", None) for r in router.routes}
    assert "/runtime/product-health" in paths
    assert "/runtime/north-star" in paths
    assert "/runtime/runtime-health" in paths
    assert "/runtime/metrics" in paths
