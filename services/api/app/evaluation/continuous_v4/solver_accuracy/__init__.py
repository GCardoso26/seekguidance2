"""Precisão do solver (stub)."""

from __future__ import annotations


def solver_accuracy_stub(correct: int, total: int) -> float:
    return round(correct / max(1, total), 4)
