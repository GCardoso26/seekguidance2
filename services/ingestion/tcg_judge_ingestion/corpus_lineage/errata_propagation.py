"""Linha de propagação de errata."""

from __future__ import annotations


def errata_propagation_edges(errata_ids: list[str]) -> list[tuple[str, str]]:
    s = sorted(errata_ids)
    if len(s) < 2:
        return []
    return [(s[i], s[i + 1]) for i in range(len(s) - 1)]
