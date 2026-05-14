"""Cenários de loops de replacement effects."""

from __future__ import annotations


def replacement_loop_score(replacement_count: int) -> float:
    return min(1.0, replacement_count / 10.0)
