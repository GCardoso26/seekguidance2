"""Diff semântico entre revisões."""
from __future__ import annotations

from typing import Any

GAME_SLUG = 'riftbound'


def diff_stub(a_hash: str, b_hash: str) -> dict[str, Any]:
    return {"game": GAME_SLUG, "a": a_hash, "b": b_hash, "method": "semantic_stub"}
