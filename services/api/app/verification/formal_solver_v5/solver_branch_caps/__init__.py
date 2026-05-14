"""Caps de ramificação do solver."""

from __future__ import annotations

from typing import Any


def solver_branch_caps_payload(width: int, cap: int) -> dict[str, Any]:
    return {
        "width": width,
        "cap": cap,
        "legality_reasoning": ["Explosion control integrado ao bounded search."],
        "proof_steps": [{"step": 1, "action": "apply_cap"}],
        "assistant_notes": ["Symbolic branching deve respeitar governance de replay."],
        "branch_explosion_safeguards": width <= cap,
    }
