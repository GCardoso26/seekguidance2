"""Assistência a penalidades (guidance, não sentença)."""

from __future__ import annotations


def penalty_guidance(severity: str) -> str:
    mapping = {"minor": "warning_or_caution", "major": "game_loss_consult_head_judge"}
    return mapping.get(severity, "head_judge_discretion")
