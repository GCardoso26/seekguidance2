"""Perfis de reasoning Yu-Gi-Oh (SEGOC, chain, timing)."""
from __future__ import annotations

from typing import Any


def export() -> dict[str, Any]:
    return {
        "game": "yugioh",
        "module": "reasoning_profiles",
        "status": "mature_stub",
        "retrieval_tuning": {
            "lexical_weight_scale": 1.08,
            "vector_weight_scale": 0.98,
            "graph_scale": 1.04,
        },
        "graph_expansion_tuning": {"edge_min_relationship_score_hint": 0.4},
        "timing_sensitivity": "high",
        "deterministic_strictness": "medium",
        "semantic_ambiguity_threshold": 0.35,
        "precedence_model": "segoc_then_chain_order",
        "conflict_style": "chain_block_and_simultaneous",
        "edge_cases": [
            "segoc_simultaneous",
            "mandatory_optional_timing",
            "missed_timing",
            "chain_blocking",
        ],
    }
