"""Assistência a disputas de mesa (guidance, não decisão legal)."""

from __future__ import annotations

from typing import Any


def dispute_guidance(issue: str) -> dict[str, Any]:
    return {
        "issue": issue,
        "recommended_steps": ["confirm_game_state", "isolate_triggering_event", "apply_CR_then_policy"],
        "escalation": "floor_judge_if_unresolved",
    }
