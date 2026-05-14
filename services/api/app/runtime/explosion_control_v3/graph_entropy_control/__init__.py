"""Controlo de entropia de grafo V3."""

from __future__ import annotations

from app.runtime.explosion_control_v2.graph_entropy_control import graph_entropy_pressure


def graph_entropy_v3(kept: int, considered: int) -> dict[str, float]:
    p = graph_entropy_pressure(kept, considered)
    return {"pressure": round(p, 4)}
