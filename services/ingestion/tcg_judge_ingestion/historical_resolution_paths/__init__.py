"""Caminhos históricos de resolução."""

from __future__ import annotations


def historical_resolution_path(edges: list[tuple[str, str]]) -> list[str]:
    """Ordem lexical dos nós tocados (stub de caminho)."""
    nodes: set[str] = set()
    for a, b in edges:
        nodes.add(a)
        nodes.add(b)
    return sorted(nodes)
