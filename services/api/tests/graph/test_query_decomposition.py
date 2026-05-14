"""Testes: decomposição de queries."""

from __future__ import annotations

from app.query_understanding.decomposition import decompose_query
from app.query_understanding.semantic_router import route_query


def test_decompose_replacement_sba_seeds() -> None:
    q = "How do replacement effects interact with SBA during cleanup?"
    hint = route_query(q, prefer_historical=None)
    d = decompose_query(q, hint)
    assert len(d.sub_queries) >= 1
    assert "614" in d.graph_seeds or "704" in d.graph_seeds


def test_decompose_has_lexical_augmentation() -> None:
    q = "How does priority interact with triggered abilities?"
    hint = route_query(q, prefer_historical=None)
    d = decompose_query(q, hint)
    assert len(d.lexical_augmentation) > 5
