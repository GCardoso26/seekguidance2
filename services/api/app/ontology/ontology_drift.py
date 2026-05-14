"""Drift estrutural de ontologia."""

from __future__ import annotations


def ontology_drift_score(relationship_delta: int, node_delta: int) -> float:
    return round(min(1.0, 0.02 * relationship_delta + 0.01 * node_delta), 4)
