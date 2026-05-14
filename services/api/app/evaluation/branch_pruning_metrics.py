"""Métricas de poda de ramos."""

from __future__ import annotations


def branch_pruning_ratio(input_paths: int, kept_paths: int) -> float:
    if input_paths <= 0:
        return 1.0
    return kept_paths / input_paths
