"""Testes: métricas de saúde do grafo."""

from __future__ import annotations

from app.graph.feedback.graph_health import estimate_noise_ratio, graph_health_summary


def test_graph_health_summary() -> None:
    h = graph_health_summary(mean_reinforcement=0.6, noise_ratio=0.2, traversal_efficiency=0.7)
    assert h["reasoning_quality_hint"] in ("stable", "watch")


def test_estimate_noise_ratio() -> None:
    n = estimate_noise_ratio(0.4, 30, 0.5)
    assert 0.0 <= n <= 1.0
