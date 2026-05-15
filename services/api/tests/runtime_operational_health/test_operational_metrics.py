"""Saúde operacional agregada."""

from __future__ import annotations

from app.observability.live_runtime.runtime_health_metrics import runtime_health_metrics_stub


def test_runtime_health_metrics() -> None:
    m = runtime_health_metrics_stub("o1")
    assert isinstance(m, dict)
