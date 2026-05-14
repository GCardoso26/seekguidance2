"""Ordenação topológica determinística (desempate lexicográfico)."""

from __future__ import annotations

from collections import defaultdict


def topological_role_order(
    nodes: list[str],
    edges: list[tuple[str, str]],
) -> tuple[list[str] | None, bool]:
    """Devolve ordem válida ou None se ciclo / nós inatingíveis; `ok` indica sucesso completo."""
    indeg: dict[str, int] = {n: 0 for n in nodes}
    adj: dict[str, list[str]] = defaultdict(list)
    node_set = set(nodes)
    for a, b in edges:
        if a in node_set and b in node_set:
            adj[a].append(b)
            indeg[b] += 1
    ready = sorted([n for n in nodes if indeg[n] == 0])
    out: list[str] = []
    while ready:
        n = ready.pop(0)
        out.append(n)
        for m in sorted(adj[n]):
            indeg[m] -= 1
            if indeg[m] == 0:
                ready.append(m)
        ready.sort()
    return (out, len(out) == len(nodes))
