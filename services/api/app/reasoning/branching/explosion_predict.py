"""Predição / métricas de explosão de ramos simbólicos."""

from __future__ import annotations

from typing import Any

from app.reasoning.branching.branch_pruner import prune_paths


def predict_branch_explosion(paths: list[list[str]], *, max_paths: int, max_depth: int) -> dict[str, Any]:
    _, stats = prune_paths(paths, max_paths=max_paths, max_depth=max_depth)
    kept = max(1, stats["kept"])
    amp = stats["input_paths"] / kept
    return {**stats, "amplification": round(amp, 3)}


def convergence_stability_score(deterministic: bool, branches_used: int, cap: int) -> float:
    if not deterministic:
        return 0.0
    return round(1.0 - min(1.0, branches_used / max(1, cap)), 4)
