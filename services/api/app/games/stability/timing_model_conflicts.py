"""Conflitos potenciais entre modelos de timing (hints)."""

from __future__ import annotations


def timing_conflict_hints(models: list[str]) -> dict[str, object]:
    unique = sorted(set(models))
    return {"models": unique, "potential_conflict": len(unique) > 1}
