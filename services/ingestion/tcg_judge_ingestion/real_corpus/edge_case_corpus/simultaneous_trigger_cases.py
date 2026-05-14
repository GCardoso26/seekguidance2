"""Gatilhos simultâneos."""

from __future__ import annotations


def simultaneous_hint(n_players: int) -> dict[str, str]:
    return {
        "flag": "simultaneous",
        "assistant_guidance": "Ordene por APNAP ou regras do jogo; não assuma stack único universal.",
        "n_players": str(n_players),
    }
