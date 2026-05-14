"""Detecção de graph explosion."""

from __future__ import annotations


def graph_explosion(nodes: int, cap: int) -> dict[str, object]:
    return {"nodes": nodes, "cap": cap, "exploded": nodes > cap}
