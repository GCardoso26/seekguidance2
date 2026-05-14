"""Semântica de timing / cadeia para Yu-Gi-Oh (bounded)."""

from __future__ import annotations

PRECEDENCE_ORDER: tuple[str, ...] = (
    "activation_window",
    "chain_build",
    "segoc_ordering",
    "chain_resolution",
    "trigger_timing",
)

TIMING_WINDOWS: tuple[str, ...] = (
    "open_window",
    "damage_step",
    "end_phase",
)

STACK_BEHAVIOR = "chain_lifo"
APNAP_ORDER = False
REPLACEMENT_BEFORE_SBA = False
SPELL_SPEED_CONSTRAINTS = True
