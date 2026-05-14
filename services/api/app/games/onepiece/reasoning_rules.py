"""Semântica de timing / cadeia para One Piece (bounded)."""

from __future__ import annotations

PRECEDENCE_ORDER: tuple[str, ...] = (
    "event",
    "replacement_like",
    "triggered",
    "counter_window",
    "resolution",
)

TIMING_WINDOWS: tuple[str, ...] = ("main", "battle", "end")

STACK_BEHAVIOR = "chain_like"
APNAP_ORDER = False
REPLACEMENT_BEFORE_SBA = False
