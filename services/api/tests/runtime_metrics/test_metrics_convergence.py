"""Métricas runtime e convergência."""

from __future__ import annotations

from app.observability.runtime_exporters.metrics_convergence_bridge import metrics_convergence_bridge_stub


def test_metrics_convergence_bridge() -> None:
    b = metrics_convergence_bridge_stub("m1")
    assert "live" in b
    assert "prometheus" in b
