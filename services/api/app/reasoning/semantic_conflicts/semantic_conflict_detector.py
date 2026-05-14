"""Conflitos semânticos (layers, timestamps, modificadores)."""

from __future__ import annotations

from typing import Any

from app.reasoning.causal.causal_conflict_detector import causal_cycle_conflict
from app.reasoning.continuous.dependency_layers import dependency_edges_from_effects


def detect_semantic_conflicts(
    *,
    layer_dependency_pairs: list[tuple[str, str | None]],
    timestamp_pairs_same_layer: list[tuple[int, int]],
) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    edges = dependency_edges_from_effects(layer_dependency_pairs)
    all_ids: list[str] = []
    for eid, dep in layer_dependency_pairs:
        all_ids.append(eid)
        if dep:
            all_ids.append(dep)
    ids = sorted(set(all_ids))
    out.extend(causal_cycle_conflict(ids, edges))
    for a, b in timestamp_pairs_same_layer:
        if a == b:
            out.append(
                {
                    "type": "timestamp_conflict_same_effect",
                    "severity": "high",
                    "notes": "Two continuous effects share timestamp ordering ambiguity.",
                }
            )
    return out
