"""Caps explícitos para ramificação multiplayer."""

from __future__ import annotations

from typing import Any


def multiplayer_branch_caps_stub(players: int, branches: int, cap: int) -> dict[str, Any]:
    return {
        "players": players,
        "branches": branches,
        "cap": cap,
        "capped": branches > cap,
        "assistant_notes": ["APNAP e interações cruzadas exigem limites explícitos em produção."],
    }
