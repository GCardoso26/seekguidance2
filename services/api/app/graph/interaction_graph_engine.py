"""Engine de clusterização de interações."""

from __future__ import annotations


def interaction_clusters(tokens: list[str]) -> list[list[str]]:
    cluster_a = [t for t in tokens if "trigger" in t or "priority" in t]
    cluster_b = [t for t in tokens if "replace" in t or "instead" in t]
    return [c for c in [cluster_a, cluster_b] if c]
