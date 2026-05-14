"""Precisão de transições vs suite canónica."""

from __future__ import annotations


def transition_step_match(expected: list[str], actual_interactions: list[str]) -> float:
    if not expected:
        return 1.0
    n = min(len(expected), len(actual_interactions))
    if n == 0:
        return 0.0
    hits = sum(1 for i in range(n) if expected[i] == actual_interactions[i])
    return hits / len(expected)
