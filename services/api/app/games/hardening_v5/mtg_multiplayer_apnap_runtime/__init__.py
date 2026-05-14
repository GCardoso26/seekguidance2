"""MTG — APNAP multiplayer (stub assistente)."""

from __future__ import annotations

from typing import Any


def mtg_multiplayer_apnap_runtime_v5_stub(players: int) -> dict[str, Any]:
    return {
        "players": players,
        "apnap": True,
        "assistant_notes": ["APNAP formal assistido; mesa real decide edge cases."],
    }
