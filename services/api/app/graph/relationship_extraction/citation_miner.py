"""Sobreposição de citações / referências entre dois conjuntos de regras."""

from __future__ import annotations


def jaccard_overlap(a: set[str], b: set[str]) -> float:
    if not a or not b:
        return 0.0
    inter = len(a & b)
    union = len(a | b)
    return float(inter) / float(union) if union else 0.0


def citation_overlap_score(refs_a: set[str], refs_b: set[str]) -> float:
    """0–1: overlap de conjuntos de referências (paths ou heads normalizados)."""
    if not refs_a or not refs_b:
        return 0.0
    return jaccard_overlap(refs_a, refs_b)
