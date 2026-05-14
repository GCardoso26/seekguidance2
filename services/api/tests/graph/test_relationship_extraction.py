"""Testes: extração lexical e inferência de score."""

from __future__ import annotations

from app.graph.relationship_extraction.extractor import extract_rule_heads, extract_rule_refs
from app.graph.relationship_extraction.inference_engine import EdgeSignals, combine_relationship_score


def test_extract_rule_refs_mtg_style() -> None:
    t = "See rule 614.12c and 704.5s for SBAs."
    refs = extract_rule_refs(t)
    assert any(r.startswith("614") for r in refs)
    heads = extract_rule_heads(t)
    assert "614" in heads and "704" in heads


def test_combine_relationship_score_weights() -> None:
    s = EdgeSignals(1.0, 1.0, 1.0, 1.0, 1.0)
    assert abs(combine_relationship_score(s) - 1.0) < 1e-6
    s2 = EdgeSignals(0.0, 0.0, 0.0, 0.0, 0.0)
    assert combine_relationship_score(s2) == 0.0


def test_batch_offline_builds_edges() -> None:
    from uuid import uuid4

    from app.graph.relationship_extraction.batch_offline import build_edges_from_document_corpus

    d = uuid4()
    rows = [
        (d, "614.1", "Replacement effects modify how damage is handled."),
        (d, "704.5", "State-based actions include life total checks."),
        (d, "117.1", "Priority determines when players may cast spells."),
    ]
    edges = build_edges_from_document_corpus(rows, window=3, min_relationship_score=0.01)
    assert isinstance(edges, list)
