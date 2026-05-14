"""Precisão do solver em runtime."""

from __future__ import annotations


def solver_accuracy_runtime(correct: int, judged: int) -> float:
    return round(correct / max(1, judged), 4)
