"""Controlo de ramos multiplayer."""

from __future__ import annotations


def multiplayer_branch_cap_stub(branches: int, players: int) -> int:
    cap = max(8, players * 16)
    return min(branches, cap)
