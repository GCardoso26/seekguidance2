"""Exploração exaustiva limitada (timing / triggers / APNAP / SEGOC) — feature-gated."""

from __future__ import annotations

from itertools import permutations
from typing import Any


def bounded_timing_orders(events: list[str], max_events: int = 4) -> list[tuple[str, ...]]:
    if len(events) > max_events:
        return []
    return list(permutations(events))


def segoc_pairing_stub(mandatory: list[str], optional: list[str]) -> dict[str, Any]:
    return {"mandatory": mandatory, "optional": optional, "ordering_policy": "turn_player_then_np_apnap_stub"}


def apnap_window_stub(active_player: str, responses: list[str]) -> dict[str, Any]:
    return {"active": active_player, "np_order_clockwise": True, "responses": responses}
