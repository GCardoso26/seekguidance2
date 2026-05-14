"""Completude semântica (proxy)."""

from __future__ import annotations


def semantic_completeness(required_fields: set[str], present: set[str]) -> float:
    if not required_fields:
        return 1.0
    return round(len(required_fields & present) / len(required_fields), 4)
