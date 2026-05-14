"""Testes: expansão adaptativa e cap de seeds."""

from __future__ import annotations

from app.core.config import Settings
from app.graph.adaptive_expansion import compute_graph_expansion_limit, dedupe_cap_heads


def _s() -> Settings:
    return Settings(database_url="postgresql+asyncpg://x", redis_url="redis://x")


def test_dedupe_cap_heads_order() -> None:
    h = dedupe_cap_heads(["704", "614", "704", "999", "abc"], max_heads=3)
    assert h == ["704", "614", "999"]


def test_compute_graph_expansion_limit_bounds() -> None:
    s = _s()
    lo = compute_graph_expansion_limit(
        s,
        query_complexity=0.1,
        classifier_confidence=0.9,
        token_budget_available=8000,
        intent_label="timing",
    )
    hi = compute_graph_expansion_limit(
        s,
        query_complexity=0.95,
        classifier_confidence=0.4,
        token_budget_available=8000,
        intent_label="unknown",
    )
    assert s.graph_expansion_min <= lo <= s.graph_expansion_max
    assert s.graph_expansion_min <= hi <= s.graph_expansion_max
