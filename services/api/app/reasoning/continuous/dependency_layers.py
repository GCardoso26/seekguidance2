"""Grafo de dependências entre efeitos contínuos."""

from __future__ import annotations

from typing import Any


def dependency_edges_from_effects(effects: list[tuple[str, str | None]]) -> list[tuple[str, str]]:
    """(effect_id, dependency_effect_id_or_None)."""
    edges: list[tuple[str, str]] = []
    for eid, dep in effects:
        if dep:
            edges.append((dep, eid))
    return edges


def summarize_dependency_graph(edges: list[tuple[str, str]]) -> dict[str, Any]:
    return {"dependency_edges": [{"from": a, "to": b} for a, b in edges], "n_edges": len(edges)}
