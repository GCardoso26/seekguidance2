"""Alert Runtime — evaluates mart-backed KPIs. No external notifications."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any


@dataclass
class Alert:
    id: str
    severity: str  # info | warning | critical
    kind: str
    message: str
    metric_id: str | None
    value: float | None
    threshold: float | None
    created_at: str


def evaluate_alerts(marts: dict[str, dict[str, Any]]) -> list[Alert]:
    now = datetime.now(UTC).isoformat()
    alerts: list[Alert] = []

    orders = marts.get("mart_orders", {})
    search = marts.get("mart_search", {})
    conversion = marts.get("mart_conversion", {})
    health = marts.get("mart_product_health", {})
    north = marts.get("mart_north_star", {})
    buyers = marts.get("mart_buyers", {})
    sellers = marts.get("mart_sellers", {})

    def add(
        severity: str,
        kind: str,
        message: str,
        metric_id: str | None = None,
        value: float | None = None,
        threshold: float | None = None,
    ) -> None:
        alerts.append(
            Alert(
                id=f"{kind}:{severity}:{metric_id or 'na'}",
                severity=severity,
                kind=kind,
                message=message,
                metric_id=metric_id,
                value=value,
                threshold=threshold,
                created_at=now,
            )
        )

    cr = float(conversion.get("conversion_rate") or 0)
    if cr < 0.005:
        add("critical", "conversion_drop", "Conversion below critical threshold", "conversion_rate", cr, 0.005)
    elif cr < 0.01:
        add("warning", "conversion_drop", "Conversion below warning threshold", "conversion_rate", cr, 0.01)

    gmv = float(orders.get("gmv") or 0)
    gmv_delta = float(orders.get("gmv_wow_delta") or 0)
    if gmv_delta <= -0.3 and gmv > 0:
        add("critical", "gmv_drop", "GMV dropped ≥30% WoW", "gmv", gmv_delta, -0.3)

    ctr = float(search.get("ctr") or 0)
    if search.get("searches", 0) >= 20 and ctr < 0.1:
        add("warning", "ctr_drop", "Search CTR low", "search_ctr", ctr, 0.1)

    success = float(search.get("success_rate") or 1)
    if search.get("searches", 0) >= 20 and success < 0.6:
        add("warning", "search_success_drop", "Search success degraded", "search_success", success, 0.6)

    ahs = float(health.get("analytics_health_score") or 100)
    if ahs < 50:
        add("critical", "analytics_health_low", "Analytics Health critical", "analytics_health_score", ahs, 50)
    elif ahs < 75:
        add("warning", "analytics_health_low", "Analytics Health watch", "analytics_health_score", ahs, 75)

    phs = float(health.get("product_health_score") or 100)
    if phs < 70:
        add("critical", "product_health_low", "Product Health critical", "product_health_score", phs, 70)
    elif phs < 80:
        add("warning", "product_health_low", "Product Health attention", "product_health_score", phs, 80)

    dlq = int(health.get("dlq_pending") or 0)
    if dlq > 500:
        add("critical", "dlq_growth", "DLQ pending exceeding threshold", None, float(dlq), 500)
    elif dlq > 100:
        add("warning", "dlq_growth", "DLQ pending elevated", None, float(dlq), 100)

    lcp = float(health.get("lcp_seconds") or 0)
    if lcp > 2.5:
        add("warning", "lcp_degraded", "LCP degraded", None, lcp, 2.0)

    if int(sellers.get("active_sellers") or 0) == 0 and int(orders.get("orders_completed") or 0) > 0:
        add("info", "sellers_drop", "No active sellers in window despite orders", "sellers_active", 0, 1)

    if int(buyers.get("active_buyers") or 0) == 0 and int(north.get("orders_7d") or 0) > 0:
        add("warning", "buyers_drop", "Active buyers missing while NSM > 0", "buyers_active", 0, 1)

    if int(north.get("orders_7d") or 0) == 0:
        add("info", "orders_drop", "No completed orders in 7d (baseline may be zero)", "north_star_orders_7d", 0, 1)

    return alerts


def alerts_to_mart(alerts: list[Alert]) -> dict[str, Any]:
    return {
        "count": len(alerts),
        "by_severity": {
            "info": sum(1 for a in alerts if a.severity == "info"),
            "warning": sum(1 for a in alerts if a.severity == "warning"),
            "critical": sum(1 for a in alerts if a.severity == "critical"),
        },
        "items": [
            {
                "id": a.id,
                "severity": a.severity,
                "kind": a.kind,
                "message": a.message,
                "metric_id": a.metric_id,
                "value": a.value,
                "threshold": a.threshold,
                "created_at": a.created_at,
            }
            for a in alerts
        ],
    }
