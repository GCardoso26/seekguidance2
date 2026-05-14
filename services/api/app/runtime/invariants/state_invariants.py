"""Invariantes de estado de runtime."""

from __future__ import annotations


def check_state_invariants(state: dict[str, int]) -> list[str]:
    violations: list[str] = []
    for k, v in state.items():
        if v < 0:
            violations.append(f"negative:{k}")
    return violations
