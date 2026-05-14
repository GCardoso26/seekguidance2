"""Testes: scoring de arestas inferidas."""

from __future__ import annotations

from app.graph.relationship_extraction.inference_engine import EdgeSignals, build_inferred_edge


def test_build_inferred_edge_stable() -> None:
    sig = EdgeSignals(
        semantic_similarity=0.6,
        citation_overlap=0.5,
        cooccurrence_score=0.4,
        lexical_match=0.3,
        llm_confidence=0.0,
    )
    e = build_inferred_edge(
        "614",
        "704",
        sig,
        context_blob="replacement effects and state-based actions",
        evidence_tags=["semantic_similarity", "cooccurrence"],
    )
    assert e.source_rule_id == "614"
    assert e.target_rule_id == "704"
    assert 0.0 <= e.relationship_score <= 1.0
    assert e.evidence
