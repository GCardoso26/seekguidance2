"""Exaustão limitada de ordens de eventos (stub combinatório)."""

from __future__ import annotations

from itertools import permutations


def bounded_orderings(events: list[str], max_branch: int = 24) -> list[tuple[str, ...]]:
    if len(events) > 4:
        return []
    out = list(permutations(events))
    return out[:max_branch]
