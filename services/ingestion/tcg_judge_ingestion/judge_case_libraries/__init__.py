"""Biblioteca de casos de juiz."""

from __future__ import annotations


def judge_case_stub(n: int) -> list[str]:
    return [f"judge_case_{i}" for i in range(min(n, 5))]
