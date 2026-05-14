"""Grafo de regras para expansão de retrieval (gameplay / interações)."""

from app.graph.adaptive_expansion import compute_graph_expansion_limit, dedupe_cap_heads
from app.graph.graph_retrieval import expand_hits_with_graph, fetch_graph_neighbor_ids
from app.graph.relationships import RuleRelation
from app.graph.semantic_links import neighbor_heads_for_paths, rule_numeric_head

__all__ = [
    "RuleRelation",
    "neighbor_heads_for_paths",
    "rule_numeric_head",
    "expand_hits_with_graph",
    "fetch_graph_neighbor_ids",
    "compute_graph_expansion_limit",
    "dedupe_cap_heads",
]
