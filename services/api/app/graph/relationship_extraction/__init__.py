"""Pacote: extração e inferência de relações entre regras (offline + sinais híbridos)."""

from app.graph.relationship_extraction.citation_miner import citation_overlap_score, jaccard_overlap
from app.graph.relationship_extraction.cooccurrence import (
    max_pair_count,
    normalize_cooccurrence,
    pair_counts_from_ordered_heads,
)
from app.graph.relationship_extraction.extractor import (
    extract_rule_heads,
    extract_rule_refs,
    lexical_pair_match_strength,
)
from app.graph.relationship_extraction.graph_store import upsert_rule_graph_edges
from app.graph.relationship_extraction.inference_engine import (
    EdgeSignals,
    build_inferred_edge,
    combine_relationship_score,
    infer_relationship_type,
)
from app.graph.relationship_extraction.llm_graph_builder import llm_propose_edges_from_snippets
from app.graph.relationship_extraction.schema import InferredRuleEdge
from app.graph.relationship_extraction.similarity import cosine_similarity

__all__ = [
    "InferredRuleEdge",
    "EdgeSignals",
    "combine_relationship_score",
    "build_inferred_edge",
    "infer_relationship_type",
    "extract_rule_refs",
    "extract_rule_heads",
    "lexical_pair_match_strength",
    "citation_overlap_score",
    "jaccard_overlap",
    "cosine_similarity",
    "pair_counts_from_ordered_heads",
    "normalize_cooccurrence",
    "max_pair_count",
    "upsert_rule_graph_edges",
    "llm_propose_edges_from_snippets",
]
