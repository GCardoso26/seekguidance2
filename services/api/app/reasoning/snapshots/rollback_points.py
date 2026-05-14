"""Pontos de rollback nomeados (bounded)."""

from __future__ import annotations


def rollback_labels() -> tuple[str, ...]:
    return ("pre_combat", "post_sba", "stack_empty", "priority_open")
