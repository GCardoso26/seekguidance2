"""Resolução de torneio (assistência procedural, não jurídica)."""

from __future__ import annotations


def suggest_extension_policy(minutes_over: int) -> str:
    if minutes_over <= 0:
        return "no_extension_needed"
    if minutes_over < 5:
        return "optional_single_turn_extension"
    return "head_judge_discretion"
