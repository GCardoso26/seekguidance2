"""Rulings / judge blogs / FAQ."""
from __future__ import annotations

from typing import Any

GAME_SLUG = 'lorcana'


def rulings_sources() -> list[dict[str, Any]]:
    return [{"kind": "official_ruling", "game": GAME_SLUG}]
