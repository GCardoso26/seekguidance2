"""Simulação simbólica explícita (API estável para expansão futura)."""

from __future__ import annotations

from typing import Any

from app.reasoning.state_engine.state_transition_engine import evolve_along_roles


def run_symbolic_simulation(roles: list[str], question: str, game_slug: str) -> dict[str, Any]:
    states, trans = evolve_along_roles(roles, question, game_slug)
    return {
        "n_states": len(states),
        "transitions": trans,
        "final_state_id": states[-1].state_id if states else "",
    }
