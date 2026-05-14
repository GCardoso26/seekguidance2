"""Taxonomia semântica (tags estáveis)."""

from __future__ import annotations

SEMANTIC_TAGS: frozenset[str] = frozenset(
    {
        "ordered_resolution_window",
        "state_based_cleanup",
        "replacement_redirect",
        "continuous_modifier",
        "chain_response",
        "memory_transition",
    }
)


def tag_known(label: str) -> bool:
    return label in SEMANTIC_TAGS
