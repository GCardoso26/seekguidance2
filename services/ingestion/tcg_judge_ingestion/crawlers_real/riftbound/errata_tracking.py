"""Errata / release notes."""
from __future__ import annotations

from typing import Any

GAME_SLUG = 'riftbound'


def errata_entry_stub(errata_id: str) -> dict[str, Any]:
    return {"game": GAME_SLUG, "errata_id": errata_id, "tracked": True}
