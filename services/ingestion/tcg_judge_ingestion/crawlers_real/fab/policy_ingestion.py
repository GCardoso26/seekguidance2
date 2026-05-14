"""Tournament policy / penalty guidelines."""
from __future__ import annotations

from typing import Any

GAME_SLUG = 'fab'


def policy_sources() -> list[dict[str, Any]]:
    return [{"kind": "tournament_policy", "game": GAME_SLUG}]
