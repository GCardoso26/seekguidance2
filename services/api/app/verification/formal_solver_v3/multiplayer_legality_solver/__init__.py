"""Multiplayer — payload formal + assistente."""

from __future__ import annotations

from typing import Any

from app.verification.formal_solver_v2.multiplayer_consistency_solver import multiplayer_consistency_assistant


def multiplayer_legality_payload(players: int, simultaneous: int) -> dict[str, Any]:
    return multiplayer_consistency_assistant(players, simultaneous)
