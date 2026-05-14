"""Consistência multiplayer — complementa sketch existente."""

from __future__ import annotations

from typing import Any

from app.verification.formal_solver.multiplayer_stub import multiplayer_legality_sketch


def multiplayer_consistency_assistant(players: int, simultaneous_actions: int) -> dict[str, Any]:
    tech = multiplayer_legality_sketch(players, simultaneous_actions)
    return {
        "assistant_note": "Use APNAP / ordem do jogo atual; este módulo não aplica penalidades.",
        "sketch": tech,
    }
