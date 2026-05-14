"""Semântica de timing / cadeia para Lorcana (bounded)."""

from __future__ import annotations

PRECEDENCE_ORDER: tuple[str, ...] = (
    "cost",
    "effect",
    "replacement_like",
    "state_check",
    "queue_resolution",
)

TIMING_WINDOWS: tuple[str, ...] = ("main", "challenge", "end")

STACK_BEHAVIOR = "queue_fifo_priority_pass"
APNAP_ORDER = False
REPLACEMENT_BEFORE_SBA = False
