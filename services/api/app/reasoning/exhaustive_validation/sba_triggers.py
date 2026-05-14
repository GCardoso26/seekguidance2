"""SBA / triggers ordenados (exaustão limitada por cardinalidade)."""

from __future__ import annotations

from itertools import permutations
from typing import Any


def exhaustive_sba_ordering_stub(labels: list[str]) -> list[tuple[str, ...]]:
    if len(labels) > 5:
        return []
    return sorted(permutations(sorted(labels)))


def exhaustive_trigger_ordering(triggers: list[str], cap: int = 24) -> list[tuple[str, ...]]:
    if len(triggers) > 4:
        return []
    out = list(permutations(triggers))
    return out[:cap]


def simultaneous_multiplayer_stub(actions_per_player: list[list[str]]) -> dict[str, Any]:
    return {"players": len(actions_per_player), "actions": actions_per_player, "resolution": "apnap_stub"}
