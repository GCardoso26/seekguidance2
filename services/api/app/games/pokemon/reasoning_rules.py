"""Semântica de timing / cadeia para Pokémon (bounded)."""

from __future__ import annotations

PRECEDENCE_ORDER: tuple[str, ...] = (
    "checkup",
    "between_turns",
    "simultaneous_effects",
    "replacement_like",
    "prize_penalty_recovery",
)

TIMING_WINDOWS: tuple[str, ...] = (
    "between_turns",
    "checkup_phase",
    "attack_step_effects",
)

STACK_BEHAVIOR = "effect_order_owner_choice_when_simultaneous"
APNAP_ORDER = False
REPLACEMENT_BEFORE_SBA = False
