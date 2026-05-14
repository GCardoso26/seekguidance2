"""Exaustão multiplayer (APNAP + simultâneo — linguagem assistente)."""

from __future__ import annotations

from typing import Any

from app.verification.formal_solver_v3.multiplayer_legality_solver import multiplayer_legality_payload


def multiplayer_legality_exhaustion_stub(players: int, simultaneous: int) -> dict[str, Any]:
    base = multiplayer_legality_payload(players, simultaneous)
    return {**base, "exhaustion": simultaneous > players}
