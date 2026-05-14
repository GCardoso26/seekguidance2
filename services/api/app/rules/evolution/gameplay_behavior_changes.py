"""Classificação de mudança de comportamento gameplay."""

from __future__ import annotations


def behavior_change_score(changed: bool) -> float:
    return 0.75 if changed else 0.02
