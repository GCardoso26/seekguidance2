"""Stress multiplayer MTG (APNAP, simultâneos)."""

from __future__ import annotations


def mtg_mp_pressure(*, players: int, simultaneous: bool) -> dict[str, object]:
    return {"pressure": players >= 4 and simultaneous, "players": players}
