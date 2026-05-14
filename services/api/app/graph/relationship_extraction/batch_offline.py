"""Construção offline de arestas a partir de janelas de chunks (co-ocorrência + sinais leves)."""

from __future__ import annotations

from collections import defaultdict
from uuid import UUID

from app.graph.relationship_extraction.citation_miner import citation_overlap_score
from app.graph.relationship_extraction.cooccurrence import (
    max_pair_count,
    normalize_cooccurrence,
    pair_counts_from_ordered_heads,
)
from app.graph.relationship_extraction.extractor import extract_rule_heads
from app.graph.relationship_extraction.inference_engine import EdgeSignals, build_inferred_edge
from app.graph.relationship_extraction.schema import InferredRuleEdge
from app.graph.semantic_links import rule_numeric_head


def _heads_for_row(rule_path: str | None, text: str) -> frozenset[str]:
    h = rule_numeric_head(rule_path)
    s = extract_rule_heads(text)
    if h:
        s = set(s) | {h}
    return frozenset(s)


def group_chunks_by_document(
    rows: list[tuple[UUID, str | None, str]],
) -> dict[UUID, list[tuple[str | None, str]]]:
    by: dict[UUID, list[tuple[str | None, str]]] = defaultdict(list)
    for doc_id, rp, txt in rows:
        by[doc_id].append((rp, txt))
    return dict(by)


def build_edges_from_document_corpus(
    rows: list[tuple[UUID, str | None, str]],
    *,
    window: int = 5,
    min_relationship_score: float = 0.42,
) -> list[InferredRuleEdge]:
    """
    rows: (document_id, rule_path, text)
    Gera pares de cabeçalhos co-ocorrentes por janela e score híbrido (sem embedding por defeito).
    """
    edges: dict[tuple[str, str, str], InferredRuleEdge] = {}
    by_doc = group_chunks_by_document(rows)
    for _doc, chunks in by_doc.items():
        head_sets = [_heads_for_row(rp, tx) for rp, tx in chunks]
        counts = pair_counts_from_ordered_heads(head_sets, window=window)
        max_c = max_pair_count(counts)
        combined = "\n".join(tx for _, tx in chunks)
        for (x, y), cnt in counts.items():
            if x == y:
                continue
            co = normalize_cooccurrence(cnt, max_c)
            refs = extract_rule_heads(combined)
            lex_blob = combined.lower()
            lex = 0.35
            if x in lex_blob and y in lex_blob:
                lex = 0.85
            elif x in lex_blob or y in lex_blob:
                lex = 0.55
            signals = EdgeSignals(
                semantic_similarity=0.48,
                citation_overlap=citation_overlap_score({x}, refs) * 0.5 + citation_overlap_score({y}, refs) * 0.5,
                cooccurrence_score=co,
                lexical_match=lex,
                llm_confidence=0.0,
            )
            edge = build_inferred_edge(
                x,
                y,
                signals,
                context_blob=combined[:2400],
                evidence_tags=["cooccurrence", "citation_overlap", "lexical_window"],
            )
            if edge.relationship_score < min_relationship_score:
                continue
            key = (edge.source_rule_id, edge.target_rule_id, edge.relationship_type)
            prev = edges.get(key)
            if prev is None or edge.relationship_score > prev.relationship_score:
                edges[key] = edge
    return list(edges.values())
