"""Constrói grafo simbólico de estados a partir de uma cadeia de papéis."""

from __future__ import annotations

from typing import Any

from app.reasoning.state_engine.state_legality import validate_state_legality
from app.reasoning.state_engine.state_transition_engine import evolve_along_roles
from app.reasoning.state_graph.legality_edges import legality_edge
from app.reasoning.state_graph.transition_edges import transition_edge


def build_state_graph(roles: list[str], question: str, game_slug: str) -> dict[str, Any]:
    states, trans = evolve_along_roles(roles, question, game_slug)
    nodes = [{"id": s.state_id, "legal": validate_state_legality(s, game_slug)["state_valid"]} for s in states]
    edges: list[dict[str, Any]] = []
    for t in trans:
        edges.append(transition_edge(t["from_state"], t["to_state"], t["interaction"]))
    for s in states:
        leg = validate_state_legality(s, game_slug)
        if not leg["state_valid"]:
            for reason in leg.get("illegal_conditions", [])[:4]:
                edges.append(legality_edge(s.state_id, reason))
    return {"nodes": nodes, "edges": edges, "n_states": len(states)}
