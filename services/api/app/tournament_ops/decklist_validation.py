"""Validação de decklist (heurística)."""

from __future__ import annotations

from typing import Any


def validate_decklist(cards: list[dict[str, Any]], *, min_cards: int = 60) -> dict[str, Any]:
    total = sum(int(c.get("qty", 0)) for c in cards)
    return {"valid": total >= min_cards, "total": total}
