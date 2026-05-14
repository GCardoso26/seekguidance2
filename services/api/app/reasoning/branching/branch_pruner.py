"""Limita número de ramos explorados (anti-explosão)."""

from __future__ import annotations


def prune_paths(
    paths: list[list[str]],
    *,
    max_paths: int = 4,
    max_depth: int = 16,
) -> tuple[list[list[str]], dict[str, int]]:
    trimmed = [p[:max_depth] for p in paths[:max_paths]]
    stats = {"input_paths": len(paths), "kept": len(trimmed), "max_paths": max_paths, "max_depth": max_depth}
    return trimmed, stats


def generate_candidate_paths(roles: list[str], question: str, *, max_branches: int = 4) -> list[list[str]]:
    """Gera poucas variantes simbólicas (ex.: múltiplos replacements) — sempre bounded."""
    paths: list[list[str]] = [list(roles)]
    ql = (question or "").lower()
    if ("two replacement" in ql or "multiple replacement" in ql) and "replacement" in roles:
        dup = list(roles)
        i = dup.index("replacement")
        paths.append(dup[: i + 1] + ["replacement"] + dup[i + 1 :])
    return paths[:max_branches]
