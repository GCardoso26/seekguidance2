"""Pressão One Piece — DON!! e estados."""

from __future__ import annotations

from typing import Any


def don_resource_pressure(don_spent: int, don_cap: int = 10) -> dict[str, Any]:
    return {"ratio": round(don_spent / max(1, don_cap), 3)}


def rested_active_stub(card_state: str) -> dict[str, Any]:
    return {"state": card_state, "legal_transitions": ["rested", "active"]}
