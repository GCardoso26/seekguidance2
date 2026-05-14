"""Grafo causal de eventos (arestas direcionadas)."""

from __future__ import annotations

from typing import Any


def build_causal_graph(events: list[tuple[str, str]]) -> dict[str, Any]:
    """events: (cause_label, effect_event_name)."""
    nodes = set()
    edges: list[dict[str, str]] = []
    for cause, eff in events:
        nodes.add(cause)
        nodes.add(eff)
        edges.append({"from": cause, "to": eff, "relation": "causes"})
    return {"nodes": sorted(nodes), "edges": edges}
