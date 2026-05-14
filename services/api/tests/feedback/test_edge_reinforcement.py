"""Testes: reforço e score v2."""

from __future__ import annotations

from app.graph.feedback.edge_reinforcement import _parse_edge_label, relationship_score_v2


def test_parse_edge_label() -> None:
    assert _parse_edge_label("614->704:gameplay_dependency") == ("614", "704", "gameplay_dependency")
    assert _parse_edge_label("bad") is None


def test_relationship_score_v2_bounds() -> None:
    s = relationship_score_v2(
        0.5,
        retrieval_success_boost=0.2,
        drift_penalty=0.05,
        noise_penalty=0.05,
        cross_query_consistency=0.05,
    )
    assert 0.0 <= s <= 1.0
