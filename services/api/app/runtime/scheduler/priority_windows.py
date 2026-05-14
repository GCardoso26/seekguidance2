"""Janelas de prioridade (stub cross-TCG)."""

from __future__ import annotations


def default_priority_windows(game_slug: str) -> list[str]:
    if game_slug == "mtg":
        return ["stack_lifo", "apnap_batch"]
    if game_slug in ("ygo", "yugioh"):
        return ["chain_reverse_resolution"]
    return ["sequential"]
