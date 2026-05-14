"""Invariantes de estado simbólico."""

from __future__ import annotations


def check_non_negative_counters(state: dict[str, int]) -> list[str]:
    violations: list[str] = []
    for k, v in state.items():
        if v < 0:
            violations.append(k)
    return violations
