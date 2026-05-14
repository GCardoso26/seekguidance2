"""Explosion control caps."""

from __future__ import annotations

from app.core.config import Settings
from app.graph.explosion_control import adaptive_depth_cap, graph_pressure_metrics, semantic_fanout_cap


def _s() -> Settings:
    return Settings(database_url="postgresql+asyncpg://x", redis_url="redis://x")


def test_adaptive_depth() -> None:
    cap = adaptive_depth_cap(_s(), query_complexity=0.9)
    assert _s().graph_expansion_min <= cap <= _s().graph_expansion_max


def test_semantic_fanout() -> None:
    c = semantic_fanout_cap(_s(), seed_count=3)
    assert c >= 4


def test_graph_pressure() -> None:
    m = graph_pressure_metrics(100, 20)
    assert m["pruned"] == 80
