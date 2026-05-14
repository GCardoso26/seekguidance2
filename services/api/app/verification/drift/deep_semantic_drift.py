"""Drift semântico profundo."""

from __future__ import annotations


def deep_semantic_drift(score_components: list[float]) -> float:
    if not score_components:
        return 0.0
    return round(min(1.0, sum(score_components) / len(score_components)), 4)
