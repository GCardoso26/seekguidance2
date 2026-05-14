"""Resolução de dependências entre efeitos (ordenação determinística)."""

from __future__ import annotations


def resolve_dependencies(effect_ids: list[str], edges: list[tuple[str, str]]) -> list[str] | None:
    """edges (a,b): a antes de b."""
    nodes = sorted(set(effect_ids))
    indeg = {n: 0 for n in nodes}
    adj: dict[str, list[str]] = {n: [] for n in nodes}
    for a, b in edges:
        if a in indeg and b in indeg:
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
    return out if len(out) == len(nodes) else None
