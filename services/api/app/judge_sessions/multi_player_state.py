"""Estado multi-jogador simbólico."""

from __future__ import annotations

from typing import Any


def default_multiplayer_state(players: list[str]) -> dict[str, Any]:
    return {"players": list(players), "active": players[0] if players else "none"}
