"""Lorcana: lore / exert."""

from __future__ import annotations


def lorcana_lore_pressure(lore: int, target: int) -> dict[str, object]:
    return {"song_timing_risk": lore >= target, "lore": lore}
