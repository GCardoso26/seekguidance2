"""Colapso de caminhos simbólicos equivalentes (ordem determinística)."""

from __future__ import annotations


def collapse_symbolic_paths(paths: list[list[str]]) -> list[list[str]]:
    uniq: dict[tuple[str, ...], list[str]] = {}
    for p in paths:
        key = tuple(sorted(p))
        if key not in uniq:
            uniq[key] = p
    return sorted(uniq.values(), key=lambda x: (x[0] if x else "", len(x)))
