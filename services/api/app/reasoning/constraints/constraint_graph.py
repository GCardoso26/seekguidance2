"""Grafo formal de constraints (precedência, exclusão, requisitos)."""

from __future__ import annotations

from typing import Any

from app.games.constraint_registry import get_game_constraints


def build_formal_constraint_graph(game_slug: str) -> dict[str, Any]:
    c = get_game_constraints(game_slug)
    nodes: set[str] = set()
    edges: list[dict[str, Any]] = []
    for a, b in c["must_precede"]:
        nodes.add(a)
        nodes.add(b)
        edges.append(
            {
                "source": a,
                "target": b,
                "edge_type": "precedence",
                "invalid_transition": False,
            }
        )
    for a, b in c["mutex_roles"]:
        nodes.add(a)
        nodes.add(b)
        edges.append(
            {
                "source": a,
                "target": b,
                "edge_type": "exclusive",
                "invalid_transition": True,
            }
        )
    for window, reqs in c["timing_requires"].items():
        for r in reqs:
            nodes.add(r)
            edges.append(
                {
                    "source": f"timing:{window}",
                    "target": r,
                    "edge_type": "timing_dependency",
                    "invalid_transition": False,
                }
            )
    return {
        "nodes": sorted(nodes),
        "edges": edges,
        "resolution_requirements": ["must_precede_total_order", "mutex_absent_or_sequential", "timing_windows"],
    }
