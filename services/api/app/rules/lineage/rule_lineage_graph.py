"""Grafo de lineage temporal de regras."""

from __future__ import annotations

from typing import Any


def build_lineage_graph(rule_id: str, ancestors: list[str], descendants: list[str]) -> dict[str, Any]:
    nodes = sorted(set([rule_id, *ancestors, *descendants]))
    edges = [{"from": a, "to": rule_id} for a in ancestors] + [{"from": rule_id, "to": d} for d in descendants]
    return {"nodes": nodes, "edges": edges}
