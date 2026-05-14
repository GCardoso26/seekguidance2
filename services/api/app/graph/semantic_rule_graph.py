"""Grafo semântico de regras."""

from __future__ import annotations

from typing import Any


def build_semantic_rule_graph(rule_id: str, dependencies: list[str]) -> dict[str, Any]:
    nodes = [rule_id, *dependencies]
    edges = [{"from": rule_id, "to": d, "type": "depends_on"} for d in dependencies]
    return {"nodes": sorted(set(nodes)), "edges": edges}
