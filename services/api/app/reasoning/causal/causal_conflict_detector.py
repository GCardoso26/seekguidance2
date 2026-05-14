"""Deteção de ciclos no grafo causal simbólico."""

from __future__ import annotations

from typing import Any

from app.reasoning.causal.dependency_resolution import resolve_dependencies


def causal_cycle_conflict(effect_ids: list[str], edges: list[tuple[str, str]]) -> list[dict[str, Any]]:
    order = resolve_dependencies(effect_ids, edges)
    if order is not None:
        return []
    return [
        {
            "type": "causal_dependency_cycle",
            "severity": "critical",
            "effects": effect_ids[:12],
        }
    ]
