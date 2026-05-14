"""Builder de grafo ontológico."""

from __future__ import annotations

from typing import Any


def build_ontology_graph(ontology_nodes: list[str], relationships: list[dict[str, str]]) -> dict[str, Any]:
    return {"nodes": list(ontology_nodes), "edges": list(relationships)}
