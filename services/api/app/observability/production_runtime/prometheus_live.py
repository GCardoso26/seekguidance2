"""Prometheus live (opcional; sem dependência obrigatória)."""

from __future__ import annotations

from typing import Any


def prometheus_metrics_status() -> dict[str, Any]:
    try:
        from prometheus_client import Counter  # type: ignore[import-not-found]

        _ = Counter
        return {"prometheus_client": "available", "live_counters": True}
    except ImportError:
        return {"prometheus_client": "absent", "live_counters": False}
