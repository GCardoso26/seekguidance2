"""Explosão multiplayer."""

from __future__ import annotations

from typing import Any


def multiplayer_explosion_control_stub(players: int, branches: int) -> dict[str, Any]:
    risk = branches > players * 8
    return {
        "risk": risk,
        "entropy_scoring": branches / max(players, 1) / 100.0,
        "assistant_notes": ["APNAP e interações locais por TCG."],
    }
