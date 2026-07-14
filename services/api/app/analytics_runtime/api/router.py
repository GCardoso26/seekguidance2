"""Internal read-only Product Analytics Runtime APIs."""

from __future__ import annotations

import time
from typing import Any

from fastapi import APIRouter, Query

from app.analytics_runtime.registry.metrics import list_metrics, validate_registry
from app.analytics_runtime.runtime.engine import ENGINE
from app.analytics_runtime.workers.sources import demo_snapshot

router = APIRouter(tags=["product-analytics-runtime"])


def _timed(fn: Any) -> dict[str, Any]:
    t0 = time.perf_counter()
    ENGINE.ensure_ready()
    payload = fn()
    ms = (time.perf_counter() - t0) * 1000
    if isinstance(payload, dict):
        payload = {**payload, "query_ms": round(ms, 2)}
    return payload


@router.get("/runtime/product-health")
async def get_product_health() -> dict[str, Any]:
    return _timed(lambda: {"source": "data_marts", **ENGINE.providers.product_health()})


@router.get("/runtime/north-star")
async def get_north_star() -> dict[str, Any]:
    return _timed(lambda: {"source": "data_marts", "north_star": ENGINE.providers.mart_payload("mart_north_star")})


@router.get("/runtime/dashboard/executive")
async def dashboard_executive() -> dict[str, Any]:
    return _timed(ENGINE.providers.executive)


@router.get("/runtime/dashboard/seller")
async def dashboard_seller() -> dict[str, Any]:
    return _timed(ENGINE.providers.seller)


@router.get("/runtime/dashboard/buyer")
async def dashboard_buyer() -> dict[str, Any]:
    return _timed(ENGINE.providers.buyer)


@router.get("/runtime/dashboard/search")
async def dashboard_search() -> dict[str, Any]:
    return _timed(ENGINE.providers.search)


@router.get("/runtime/dashboard/marketplace")
async def dashboard_marketplace() -> dict[str, Any]:
    return _timed(ENGINE.providers.marketplace)


@router.get("/runtime/dashboard/operations")
async def dashboard_operations() -> dict[str, Any]:
    return _timed(ENGINE.providers.operations)


@router.get("/runtime/dashboard/analytics")
async def dashboard_analytics() -> dict[str, Any]:
    return _timed(ENGINE.providers.analytics)


@router.get("/runtime/funnels")
async def get_funnels() -> dict[str, Any]:
    return _timed(lambda: {"source": "data_marts", "funnels": ENGINE.providers.mart_payload("mart_funnels")})


@router.get("/runtime/cohorts")
async def get_cohorts() -> dict[str, Any]:
    return _timed(lambda: {"source": "data_marts", "cohorts": ENGINE.providers.mart_payload("mart_cohorts")})


@router.get("/runtime/alerts")
async def get_alerts() -> dict[str, Any]:
    return _timed(lambda: {"source": "data_marts", "alerts": ENGINE.providers.mart_payload("mart_alerts")})


@router.get("/runtime/metrics")
async def get_metrics(category: str | None = None, consumer: str | None = None) -> dict[str, Any]:
    def _build() -> dict[str, Any]:
        ENGINE.ensure_ready()
        items = []
        for m in list_metrics(category=category, consumer=consumer):
            items.append(ENGINE.providers.resolve_metric_value(m.id))
        return {"source": "data_marts", "metrics": items, "registry_errors": validate_registry()}

    return _timed(_build)


@router.get("/runtime/runtime-health")
async def get_runtime_health() -> dict[str, Any]:
    return _timed(ENGINE.runtime_health)


@router.post("/runtime/analytics/materialize")
async def trigger_materialize(use_demo: bool = Query(default=True)) -> dict[str, Any]:
    """Internal ops: rematerialize from demo snapshot (DB load wired when session available)."""
    snap = demo_snapshot() if use_demo else demo_snapshot()
    result = ENGINE.materialize(snap)
    return {"ok": True, **result}


@router.post("/runtime/analytics/tick")
async def trigger_tick(force: bool = Query(default=True)) -> dict[str, Any]:
    return ENGINE.tick(force=force)
