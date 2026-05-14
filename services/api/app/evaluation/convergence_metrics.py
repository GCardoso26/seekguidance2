"""Métricas de convergência de caminhos."""

from __future__ import annotations


def convergence_quality(converged_groups: int, candidate_paths: int) -> float:
    if candidate_paths <= 1:
        return 1.0
    return min(1.0, converged_groups / max(1, candidate_paths - 1))
