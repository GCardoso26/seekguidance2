"""Backpressure de runtime."""

from __future__ import annotations


def runtime_backpressure(load: float, *, soft: float = 0.7, hard: float = 0.95) -> str:
    if load >= hard:
        return "hard"
    if load >= soft:
        return "soft"
    return "ok"
