"""Fuzzing orientado a legalidade."""

from __future__ import annotations

from app.testing.property_based.random_interaction_generator import generate_interaction


def run_legality_fuzzing(cases: int, seed_base: int = 100) -> dict[str, int]:
    illegal = 0
    for i in range(max(1, cases)):
        roles = generate_interaction(seed_base + i)
        if roles.count("replacement") > 3 and roles.count("layer") > 2:
            illegal += 1
    return {"cases_executed": max(1, cases), "illegal_states_detected": illegal}
