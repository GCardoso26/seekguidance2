"""Enriquecimento de ontologia a partir de clusters semânticos do corpus (stub)."""

from __future__ import annotations

from typing import Any


def cluster_labels_stub(terms: list[str]) -> dict[str, Any]:
    return {"clusters": len({t.lower() for t in terms}), "terms": terms[:32]}


def infer_interaction_edges_stub(cooccurrence: list[tuple[str, str, float]]) -> list[dict[str, Any]]:
    return [{"a": a, "b": b, "weight": w} for a, b, w in cooccurrence if w > 0.4]
