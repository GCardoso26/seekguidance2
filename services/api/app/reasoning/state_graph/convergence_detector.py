"""Conta grupos de caminhos que convergem para o mesmo estado final."""

from __future__ import annotations

from app.reasoning.branching.equivalence_merger import merge_equivalent_paths


def convergence_summary(paths: list[list[str]], question: str, game_slug: str) -> dict[str, int | bool]:
    _buckets, converged_groups = merge_equivalent_paths(paths, question, game_slug)
    return {"converged_path_groups": converged_groups, "has_convergence": converged_groups > 0}
