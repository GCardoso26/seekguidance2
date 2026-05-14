"""Hints de pruning por divergência de ontologia (heurístico)."""

from __future__ import annotations


def ontology_prune_hint(divergence_score: float, *, threshold: float = 0.35) -> dict[str, object]:
    return {"prune": divergence_score > threshold, "score": divergence_score, "threshold": threshold}
