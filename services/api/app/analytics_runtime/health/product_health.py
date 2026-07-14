"""Product Health + North Star calculators — mart inputs only after aggregation."""

from __future__ import annotations

from typing import Any

from app.analytics_runtime.aggregators.engine import AggregationState, SourceSnapshot


def compute_product_health(
    state: AggregationState,
    snap: SourceSnapshot,
    *,
    funnels: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """PHS 0-100 with pillars matching PRODUCT_HEALTH_RUNTIME.md (simplified Beta 2)."""
    mkt = (funnels or {}).get("funnels", {}).get("marketplace", {})
    conversion_rate = float(mkt.get("conversion") or 0)
    # Normalize conversion: target 5% → 100
    n_conversion = min(1.0, conversion_rate / 0.05) if conversion_rate else 0.5

    perf = snap.performance or {}
    lcp = float(perf.get("lcp_seconds") or 1.0)
    lighthouse = float(perf.get("lighthouse") or 95)
    n_performance = min(1.0, (lighthouse / 95) * (2.0 / max(lcp, 0.1)) / 2)

    n_availability = min(1.0, float(snap.availability))

    ahs_raw = snap.analytics_health or {}
    persisted = int(ahs_raw.get("persisted") or 0)
    dead = int(ahs_raw.get("dead_lettered") or 0)
    lost = int(ahs_raw.get("lost") or 0)
    received = max(persisted + dead + lost, 1)
    n_analytics = 1.0 - (lost / received)
    ahs = round(100 * n_analytics * (0.9 if dead / received > 0.05 else 1.0), 2)

    searches = max(state.searches, 1)
    zero_rate = state.zero_results / searches
    n_search = max(0.0, 1.0 - zero_rate)

    n_engagement = min(1.0, len(state.sessions) / 50) if state.sessions else 0.4
    n_retention = 0.5  # filled from cohorts when available
    n_satisfaction = 0.8  # proxy until survey mart

    pillars = {
        "conversion": round(100 * n_conversion, 2),
        "retention": round(100 * n_retention, 2),
        "performance": round(100 * n_performance, 2),
        "analytics": ahs,
        "availability": round(100 * n_availability, 2),
        "engagement": round(100 * n_engagement, 2),
        "satisfaction": round(100 * n_satisfaction, 2),
        "search_quality": round(100 * n_search, 2),
    }
    weights = {
        "conversion": 0.25,
        "performance": 0.15,
        "availability": 0.15,
        "analytics": 0.10,
        "search_quality": 0.10,
        "engagement": 0.10,
        "retention": 0.10,
        "satisfaction": 0.05,
    }
    score = sum(pillars[k] * weights[k] for k in weights)
    score = round(min(100.0, max(0.0, score)), 2)
    band = (
        "excellent"
        if score >= 95
        else "very_good"
        if score >= 90
        else "attention"
        if score >= 80
        else "risk"
        if score >= 70
        else "critical"
    )
    return {
        "product_health_score": score,
        "band": band,
        "pillars": pillars,
        "weights": weights,
        "analytics_health_score": ahs,
        "dlq_pending": int(ahs_raw.get("dlq_pending") or 0),
        "lcp_seconds": lcp,
        "refresh": "5m",
    }


def compute_north_star(state: AggregationState) -> dict[str, Any]:
    return {
        "north_star": state.orders_completed,
        "orders_7d": state.orders_completed,
        "definition": "completed_orders_7d",
        "guardrails": {
            "buyers_active": len(state.buyers_with_purchase),
            "sellers_active": len(state.sellers_with_sale),
            "gmv": round(state.gmv, 2),
            "conversion_rate": round(
                (state.orders_completed / state.searches) if state.searches else 0.0,
                6,
            ),
        },
        "healthy_two_sided": len(state.buyers_with_purchase) > 0 and len(state.sellers_with_sale) > 0,
    }
