"""Lineage de rulings (sucessão versionada; sem juízo legal)."""

from __future__ import annotations


def ruling_lineage_edges(ruling_ids: list[str]) -> list[tuple[str, str]]:
    """Ordena deterministicamente pares (anterior → atual)."""
    s = sorted(ruling_ids)
    if len(s) < 2:
        return []
    return [(s[i], s[i + 1]) for i in range(len(s) - 1)]
