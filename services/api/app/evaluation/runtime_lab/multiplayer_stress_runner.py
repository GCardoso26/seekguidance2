"""Stress sintético multi-jogador (ordenação determinística)."""

from __future__ import annotations

from typing import Any

from app.multiplayer.apnap_runtime import apnap_sequence


def run_multiplayer_stress(players: list[str]) -> dict[str, Any]:
    plist = players if players else ["P1"]
    active, *rest = plist
    seq = apnap_sequence(active, rest)
    return {"players": len(plist), "apnap_len": len(seq)}
