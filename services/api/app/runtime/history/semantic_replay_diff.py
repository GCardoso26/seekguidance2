"""Diferenças semânticas entre replays."""

from __future__ import annotations


def replay_divergence(old_hash: str, new_hash: str) -> float:
    return 0.0 if old_hash == new_hash else 0.07
