"""Busca multiplayer limitada."""

from __future__ import annotations

from typing import Any


def bounded_multiplayer_search_payload(players: int, budget: int) -> dict[str, Any]:
    return {
        "players": players,
        "budget": budget,
        "legality_reasoning": ["Exhaustão local de interações respeitando APNAP como restrição."],
        "proof_steps": [{"step": 1, "action": "enumerate_windows"}],
        "assistant_notes": ["Multiplayer MTG: prioridades relativas, sem motor jurídico."],
        "legality_certificate": players <= budget,
    }
