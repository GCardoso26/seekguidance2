"""Evolução de clusters semânticos."""

from __future__ import annotations


def cluster_evolution_score(old_clusters: int, new_clusters: int) -> float:
    return round(min(1.0, abs(new_clusters - old_clusters) / max(1, old_clusters + new_clusters)), 4)
