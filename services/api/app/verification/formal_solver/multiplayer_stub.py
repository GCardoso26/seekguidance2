"""Provas / sketches de legalidade em cenários multi-jogador (stub)."""

from __future__ import annotations

from typing import Any


def multiplayer_legality_sketch(players: int, simultaneous_actions: int) -> dict[str, Any]:
    return {
        "players": players,
        "simultaneous_actions": simultaneous_actions,
        "apnap_rounds_stub": max(0, players - 1),
        "status": "sketch_only",
    }
