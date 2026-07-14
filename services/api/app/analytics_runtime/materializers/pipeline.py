"""Materialize all Data Marts from AggregationState. Dashboards never see raw events."""

from __future__ import annotations

import time
from typing import Any

from app.analytics_runtime.aggregators.engine import SourceSnapshot, aggregate
from app.analytics_runtime.aggregators.top_movers import build_top_movers_mart
from app.analytics_runtime.alerts.engine import alerts_to_mart, evaluate_alerts
from app.analytics_runtime.cohorts.engine import compute_cohorts
from app.analytics_runtime.funnels.engine import compute_funnels
from app.analytics_runtime.health.product_health import compute_north_star, compute_product_health
from app.analytics_runtime.marts.store import MartStore


def materialize_all(store: MartStore, snap: SourceSnapshot, *, window_days: int = 7) -> dict[str, Any]:
    t0 = time.perf_counter()
    state = aggregate(snap, window_days=window_days)
    funnels = compute_funnels(state, snap)
    cohorts = compute_cohorts(snap)
    health = compute_product_health(state, snap, funnels=funnels)
    if cohorts.get("overall"):
        d7 = float(cohorts["overall"].get("d7") or 0.5)
        health["pillars"]["retention"] = round(100 * d7, 2)
        # recompute score lightly
        w = health["weights"]
        health["product_health_score"] = round(
            sum(health["pillars"][k] * w[k] for k in w),
            2,
        )
    north = compute_north_star(state)

    orders_payload = {
        "orders_completed": state.orders_completed,
        "gmv": round(state.gmv, 2),
        "average_order_value": round(state.gmv / state.orders_completed, 2) if state.orders_completed else 0.0,
        "gmv_wow_delta": 0.0,
        "window_days": window_days,
    }
    search_payload = {
        "searches": state.searches,
        "clicks": state.search_clicks,
        "ctr": round(state.search_clicks / state.searches, 4) if state.searches else 0.0,
        "zero_results": state.zero_results,
        "zero_results_rate": round(state.zero_results / state.searches, 4) if state.searches else 0.0,
        "success_rate": round(1 - (state.zero_results / state.searches), 4) if state.searches else 1.0,
    }
    conversion_payload = {
        "conversion_rate": round(state.orders_completed / state.searches, 6) if state.searches else 0.0,
        "checkout_started": state.checkout_started,
        "purchases": state.orders_completed,
        "cart_to_checkout": round(state.checkout_started / max(state.event_counts.get("add_to_cart", 0), 1), 4),
    }
    buyers_payload = {
        "active_buyers": len(state.buyers_with_purchase),
        "sessions": len(state.sessions),
        "active_users_24h": len(state.users_24h),
        "wishlist_created": state.wishlist_created,
        "wishlist_converted": state.wishlist_converted,
        "wishlist_conversion": round(state.wishlist_converted / state.wishlist_created, 4)
        if state.wishlist_created
        else 0.0,
    }
    sellers_payload = {
        "active_sellers": len(state.sellers_with_sale),
        "listings_created": state.event_counts.get("listing_create", 0),
        "seller_count_catalog": len(snap.sellers),
    }
    catalog_payload = {
        "items": len(snap.catalog),
        "games": {},
    }
    for item in snap.catalog:
        g = str(item.get("game") or "unknown")
        catalog_payload["games"][g] = catalog_payload["games"].get(g, 0) + 1

    # Temporary marts for alert evaluation
    draft = {
        "mart_orders": orders_payload,
        "mart_search": search_payload,
        "mart_conversion": conversion_payload,
        "mart_buyers": buyers_payload,
        "mart_sellers": sellers_payload,
        "mart_product_health": health,
        "mart_north_star": north,
    }
    alerts = evaluate_alerts(draft)
    alerts_payload = alerts_to_mart(alerts)

    window_label = f"{window_days}d"
    top_movers = build_top_movers_mart(state, snap, window=window_label)
    top_movers["summary"]["product_health_score"] = health.get("product_health_score")
    top_movers["summary"]["gmv"] = orders_payload["gmv"]

    marketplace_payload = {
        "orders": orders_payload,
        "conversion": conversion_payload,
        "search": search_payload,
        "top_movers_ref": "mart_top_movers",
    }
    product_metrics_payload = {
        "product_health": health.get("product_health_score"),
        "north_star": north.get("orders_7d"),
        "sessions": buyers_payload.get("sessions"),
        "search_success": search_payload.get("success_rate"),
        "top_movers_volume": top_movers.get("summary", {}).get("volume"),
    }

    rows = len(snap.events) + len(snap.orders)
    specs = [
        ("mart_orders", orders_payload),
        ("mart_search", search_payload),
        ("mart_conversion", conversion_payload),
        ("mart_buyers", buyers_payload),
        ("mart_sellers", sellers_payload),
        ("mart_catalog", catalog_payload),
        ("mart_product_health", health),
        ("mart_north_star", north),
        ("mart_funnels", funnels),
        ("mart_cohorts", cohorts),
        ("mart_alerts", alerts_payload),
        ("mart_top_movers", top_movers),
        ("mart_marketplace", marketplace_payload),
        ("mart_product_metrics", product_metrics_payload),
    ]
    for name, payload in specs:
        t1 = time.perf_counter()
        store.put(name, payload, source_rows=rows, duration_ms=(time.perf_counter() - t1) * 1000)

    return {
        "ok": True,
        "duration_ms": round((time.perf_counter() - t0) * 1000, 2),
        "source_rows": rows,
        "marts": [n for n, _ in specs],
        "captured_at": snap.captured_at,
    }
