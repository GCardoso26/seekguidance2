"""Métricas Prometheus live (registo opcional)."""

from __future__ import annotations

from typing import Any


def live_metrics_registry_status() -> dict[str, Any]:
    try:
        import prometheus_client  # type: ignore[import-not-found]

        _ = prometheus_client.REGISTRY
        return {"registry": "available", "live_counters": True}
    except ImportError:
        return {"registry": "absent", "live_counters": False}
