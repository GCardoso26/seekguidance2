"""Testes: expansão adaptativa com escala de routing."""

from __future__ import annotations

from app.core.config import Settings
from app.graph.adaptive_expansion import compute_graph_expansion_limit


def _s() -> Settings:
    return Settings(database_url="postgresql+asyncpg://x", redis_url="redis://x")


def test_expansion_respects_quality_ema() -> None:
    s = _s()
    hi = compute_graph_expansion_limit(
        s,
        query_complexity=0.5,
        classifier_confidence=0.8,
        token_budget_available=5000,
        intent_label="timing",
        graph_expansion_scale=1.0,
        retrieval_quality_ema=0.2,
    )
    lo = compute_graph_expansion_limit(
        s,
        query_complexity=0.5,
        classifier_confidence=0.8,
        token_budget_available=5000,
        intent_label="timing",
        graph_expansion_scale=1.0,
        retrieval_quality_ema=None,
    )
    assert hi <= lo
