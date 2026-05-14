"""Resolve cadeia semântica válida sob must_precede (bounded, determinístico)."""

from __future__ import annotations

from typing import Any

from app.games.constraint_registry import get_game_constraints
from app.reasoning.constraints.constraint_engine import expand_roles_for_constraints
from app.reasoning.deterministic.precedence_resolver import topological_role_order
from app.reasoning.deterministic.resolution_paths import RejectedPath
from app.reasoning.execution.dependency_sorter import topological_sort
from app.reasoning.execution.interaction_chain import humanize_chain
from app.reasoning.types import ExecutionStep


def solve_deterministic(planner_roles: list[str], game_slug: str) -> dict[str, Any]:
    raw = [r for r in planner_roles if r]
    unique_planner = list(dict.fromkeys(raw))
    present = expand_roles_for_constraints(set(unique_planner), game_slug)
    present_sorted = sorted(present)
    if not present_sorted:
        return {
            "validated_roles": [],
            "validated_chain": [],
            "rejected_paths": [
                RejectedPath("(empty)", "No semantic roles extracted for constraint solving.").to_dict()
            ],
            "ok": False,
        }
    must = get_game_constraints(game_slug)["must_precede"]
    edges = [(a, b) for a, b in must if a in present and b in present]
    order, ok = topological_role_order(present_sorted, edges)
    rejected: list[dict[str, str]] = []
    if not ok or order is None:
        return {
            "validated_roles": [],
            "validated_chain": [],
            "rejected_paths": [
                RejectedPath(
                    " -> ".join(unique_planner),
                    "Circular or unsortable precedence among roles.",
                ).to_dict()
            ],
            "ok": False,
        }
    if tuple(unique_planner) != tuple(order):
        rejected.append(
            RejectedPath(
                " -> ".join(unique_planner),
                "Planner order violated must_precede; deterministically reordered.",
            ).to_dict()
        )
    chain = humanize_chain(order, game_slug)
    return {
        "validated_roles": order,
        "validated_chain": chain,
        "rejected_paths": rejected,
        "ok": True,
    }


def build_steps_from_validated_roles(roles: list[str], game_slug: str) -> list[ExecutionStep]:
    lines = humanize_chain(roles, game_slug)
    prev: tuple[str, ...] = ()
    steps: list[ExecutionStep] = []
    for i, (role, desc) in enumerate(zip(roles, lines, strict=True)):
        sid = f"dstep_{i}"
        steps.append(ExecutionStep(step_id=sid, description=desc, depends_on=prev, role=role))
        prev = (sid,)
    return topological_sort(steps)
