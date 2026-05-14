"""Métricas Prometheus de runtime."""

from __future__ import annotations

from typing import Any


def prometheus_runtime_metrics_stub(job: str) -> dict[str, Any]:
    return {"job": job, "assistant_notes": ["Scrape configs em infra/observability."]}
