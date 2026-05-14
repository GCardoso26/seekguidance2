"""Invariantes para objetos de mutação formal."""

from __future__ import annotations


def check_mutation_invariants(mutations: list[dict[str, object]]) -> list[str]:
    violations: list[str] = []
    for i, m in enumerate(mutations):
        if "mutation_type" not in m:
            violations.append(f"missing_mutation_type:{i}")
        if "target_object" not in m:
            violations.append(f"missing_target_object:{i}")
    return violations
