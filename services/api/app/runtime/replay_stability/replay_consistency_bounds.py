"""Bounds de consistência de replay (score simples)."""

from __future__ import annotations


def replay_consistency_score(
    *,
    deterministic_runs_match: bool,
    hash_stable: bool,
) -> float:
    base = 0.6 if deterministic_runs_match else 0.2
    bonus = 0.4 if hash_stable else 0.0
    return round(min(1.0, base + bonus), 4)
