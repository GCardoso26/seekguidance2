"""Orquestra grafo + propagação com limites."""

from __future__ import annotations

from typing import Any

from app.games.constraint_registry import get_game_constraints
from app.reasoning.constraints.constraint_graph import build_formal_constraint_graph
from app.reasoning.constraints.propagation import build_propagation_chain


def expand_roles_for_constraints(roles: set[str], game_slug: str) -> set[str]:
    """Fecho mínimo implícito (ex.: evento antes de replacement/SBA em MTG)."""
    out = set(roles)
    if game_slug == "mtg":
        if "replacement" in out or "sba" in out:
            out.add("event")
    if game_slug == "yugioh":
        if "chain_resolution" in out or "segoc_ordering" in out:
            out.add("chain_build")
    return out


def run_constraint_engine(
    ordered_roles: list[str],
    game_slug: str,
    timing: dict[str, Any],
) -> dict[str, Any]:
    c = get_game_constraints(game_slug)
    max_p = min(int(c["max_propagation"]), 48)
    graph = build_formal_constraint_graph(game_slug)
    propagation = build_propagation_chain(ordered_roles, max_steps=max_p)
    return {
        "constraint_graph": graph,
        "propagation_chain": propagation,
        "timing_context": timing.get("window"),
    }
