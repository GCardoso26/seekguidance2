"""Evolução de taxonomias semânticas."""

from __future__ import annotations


def taxonomy_shift(old_nodes: list[str], new_nodes: list[str]) -> float:
    so, sn = set(old_nodes), set(new_nodes)
    if not so and not sn:
        return 0.0
    return round(1.0 - (len(so & sn) / max(1, len(so | sn))), 4)
