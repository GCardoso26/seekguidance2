"""Grafo de dependências derivado de must_precede."""

from __future__ import annotations

from collections import defaultdict

from app.reasoning.constraints.precedence_constraints import active_must_precede_edges


def dependency_adjacency(game_slug: str, roles_present: set[str]) -> dict[str, list[str]]:
    edges = active_must_precede_edges(game_slug, roles_present)
    adj: dict[str, list[str]] = defaultdict(list)
    for a, b in edges:
        adj[a].append(b)
    for k in adj:
        adj[k] = sorted(adj[k])
    return dict(adj)
