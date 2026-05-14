"""Tuning adaptativo (caps dinâmicos, entropy-aware)."""

from __future__ import annotations

from app.core.config import Settings
from app.graph.adaptive_expansion import compute_graph_expansion_limit


def adaptive_branch_cap(
    settings: Settings,
    *,
    query_complexity: float,
    classifier_confidence: float,
    entropy: float,
) -> int:
    base = compute_graph_expansion_limit(
        settings,
        query_complexity=query_complexity,
        classifier_confidence=classifier_confidence,
        token_budget_available=None,
        intent_label="gameplay_rules",
    )
    if entropy > settings.graph_explosion_entropy_prune_threshold:
        return max(settings.graph_expansion_min, int(base * 0.88))
    return base


def entropy_aware_prune(entropy: float, threshold: float) -> bool:
    return entropy > threshold
