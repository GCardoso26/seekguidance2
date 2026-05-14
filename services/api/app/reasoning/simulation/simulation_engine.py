"""Simulação semântica bounded: encadeia plano + transições de estado."""

from __future__ import annotations

from app.reasoning.simulation.interaction_executor import execute_plan
from app.reasoning.simulation.state_transition import initial_state, terminal_state
from app.reasoning.types import ExecutionStep, SimulationTrace


def simulate(
    question: str,
    game_slug: str,
    steps: list[ExecutionStep],
    *,
    max_steps: int = 20,
    allowed_roles: set[str] | None = None,
) -> SimulationTrace:
    before = initial_state(question, game_slug)
    seq = steps[:max_steps]
    if allowed_roles is not None:
        seq = [s for s in seq if s.role is None or s.role in allowed_roles]
    applied = execute_plan(seq)
    return SimulationTrace(before_state=before, steps=applied, after_state=terminal_state())
