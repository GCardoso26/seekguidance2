"""Profiler de expansão de grafo (densidade / profundidade)."""

from __future__ import annotations

from typing import Any


def graph_expansion_profile(*, depth: int, visited: int, budget: int) -> dict[str, Any]:
    return {
        "depth": depth,
        "visited": visited,
        "budget": budget,
        "density_proxy": round(visited / max(1, budget), 4),
    }
