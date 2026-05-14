"""Heurísticas de recursão infinita aparente (profundidade de pilha simbólica)."""

from __future__ import annotations

from typing import Any


def infinite_recursion_hint(call_graph_depth: int, *, cap: int = 64) -> dict[str, Any]:
    return {"risk": call_graph_depth > cap, "depth": call_graph_depth, "cap": cap}


def symbolic_recursion_budget_stub(ops: int, *, budget: int = 10_000) -> dict[str, Any]:
    return {"exhausted": ops > budget, "ops": ops, "budget": budget}
