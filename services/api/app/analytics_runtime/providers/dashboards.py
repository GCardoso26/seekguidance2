"""Dashboard providers — read ONLY from Materialized Data Marts (+ cache)."""

from __future__ import annotations

from typing import Any

from app.analytics_runtime.cache.store import RuntimeCache
from app.analytics_runtime.marts.store import MartStore
from app.analytics_runtime.registry.metrics import METRIC_REGISTRY, list_metrics


class DashboardProviders:
    def __init__(self, store: MartStore, cache: RuntimeCache) -> None:
        self.store = store
        self.cache = cache

    def _mart(self, name: str) -> dict[str, Any]:
        return self.cache.get_or_set(f"mart:{name}", lambda: self.store.get_payload(name), ttl=30)

    def mart_payload(self, name: str) -> dict[str, Any]:
        return self._mart(name)

    def executive(self) -> dict[str, Any]:
        return {
            "dashboard": "executive",
            "north_star": self._mart("mart_north_star"),
            "orders": self._mart("mart_orders"),
            "product_health": self._mart("mart_product_health"),
            "alerts": self._mart("mart_alerts"),
            "conversion": self._mart("mart_conversion"),
            "source": "data_marts",
        }

    def seller(self) -> dict[str, Any]:
        return {
            "dashboard": "seller",
            "sellers": self._mart("mart_sellers"),
            "orders": self._mart("mart_orders"),
            "source": "data_marts",
        }

    def buyer(self) -> dict[str, Any]:
        return {
            "dashboard": "buyer",
            "buyers": self._mart("mart_buyers"),
            "cohorts": self._mart("mart_cohorts"),
            "funnels": self._mart("mart_funnels"),
            "source": "data_marts",
        }

    def search(self) -> dict[str, Any]:
        return {
            "dashboard": "search",
            "search": self._mart("mart_search"),
            "conversion": self._mart("mart_conversion"),
            "source": "data_marts",
        }

    def marketplace(self) -> dict[str, Any]:
        return {
            "dashboard": "marketplace",
            "orders": self._mart("mart_orders"),
            "conversion": self._mart("mart_conversion"),
            "funnels": self._mart("mart_funnels"),
            "catalog": self._mart("mart_catalog"),
            "source": "data_marts",
        }

    def operations(self) -> dict[str, Any]:
        return {
            "dashboard": "operations",
            "product_health": self._mart("mart_product_health"),
            "alerts": self._mart("mart_alerts"),
            "source": "data_marts",
        }

    def analytics(self) -> dict[str, Any]:
        return {
            "dashboard": "analytics",
            "product_health": self._mart("mart_product_health"),
            "alerts": self._mart("mart_alerts"),
            "metrics": [
                {"id": m.id, "source": m.source, "refresh": m.refresh_interval}
                for m in list_metrics(category="analytics")
            ],
            "source": "data_marts",
        }

    def product_health(self) -> dict[str, Any]:
        return {"dashboard": "product_health", **self._mart("mart_product_health"), "source": "data_marts"}

    def resolve_metric_value(self, metric_id: str) -> dict[str, Any]:
        meta = METRIC_REGISTRY[metric_id]
        payload = self._mart(meta.source)
        # Map common ids onto mart fields
        mapping = {
            "orders_completed": ("orders_completed", "mart_orders"),
            "gmv": ("gmv", "mart_orders"),
            "average_order_value": ("average_order_value", "mart_orders"),
            "buyers_active": ("active_buyers", "mart_buyers"),
            "sellers_active": ("active_sellers", "mart_sellers"),
            "conversion_rate": ("conversion_rate", "mart_conversion"),
            "sessions": ("sessions", "mart_buyers"),
            "active_users": ("active_users_24h", "mart_buyers"),
            "search_ctr": ("ctr", "mart_search"),
            "search_zero_results": ("zero_results_rate", "mart_search"),
            "search_success": ("success_rate", "mart_search"),
            "product_health_score": ("product_health_score", "mart_product_health"),
            "analytics_health_score": ("analytics_health_score", "mart_product_health"),
            "north_star_orders_7d": ("orders_7d", "mart_north_star"),
            "wishlist_conversion": ("wishlist_conversion", "mart_buyers"),
            "retention_d7": ("overall", "mart_cohorts"),
            "runtime_health_score": ("product_health_score", "mart_product_health"),
        }
        field, _ = mapping.get(metric_id, (None, meta.source))
        value: Any
        if metric_id == "retention_d7":
            value = (payload.get("overall") or {}).get("d7")
        elif field:
            value = payload.get(field)
        else:
            value = None
        return {
            "id": meta.id,
            "value": value,
            "meta": {
                "owner": meta.owner,
                "formula": meta.formula,
                "source": meta.source,
                "refresh": meta.refresh_interval,
                "version": meta.version,
                "consumers": list(meta.consumers),
                "warning_threshold": meta.warning_threshold,
                "critical_threshold": meta.critical_threshold,
            },
            "source": "data_marts",
        }
