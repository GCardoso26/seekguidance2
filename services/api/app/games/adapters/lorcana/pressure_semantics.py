"""Pressão Lorcana — lore / desafios."""

from __future__ import annotations

from typing import Any


def lore_progression_pressure(lore: int, cap: int = 20) -> dict[str, Any]:
    return {"lore_ratio": round(lore / max(1, cap), 3)}


def challenge_timing_stub(active: bool) -> dict[str, Any]:
    return {"challenge_active": active}
