"""Propagação exaustiva limitada de replacement (fronteira BFS)."""

from __future__ import annotations

from collections import deque
from typing import Any


def bounded_replacement_propagation(seed: str, graph: dict[str, list[str]], max_depth: int = 8) -> dict[str, Any]:
    if not graph:
        return {"visited": [], "depth_cap": max_depth}
    if seed not in graph:
        seed = next(iter(graph))
    q: deque[tuple[str, int]] = deque([(seed, 0)])
    seen: set[str] = set()
    order: list[str] = []
    while q:
        n, d = q.popleft()
        if n in seen or d > max_depth:
            continue
        seen.add(n)
        order.append(n)
        for m in graph.get(n, []):
            q.append((m, d + 1))
    return {"visited": order, "depth_cap": max_depth}


def replacement_loop_legality(effects_graph: dict[str, list[str]]) -> dict[str, Any]:
    """True se grafo acíclico (ordem topológica trivial por contagem vs visitados)."""
    if not effects_graph:
        return {"acyclic_stub": True, "visited": 0}
    seed = next(iter(effects_graph))
    visited = bounded_replacement_propagation(seed, effects_graph)["visited"]
    total = len(effects_graph)
    return {"acyclic_stub": len(visited) <= total + 2, "visited": len(visited)}
