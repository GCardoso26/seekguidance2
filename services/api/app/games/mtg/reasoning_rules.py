"""Semântica de timing / ordem para MTG (referência CR; não substitui fonte oficial)."""

from __future__ import annotations

# Ordem lógica bounded para interaction resolution (não emula passos reais do jogo).
PRECEDENCE_ORDER: tuple[str, ...] = (
    "event",
    "replacement",
    "sba",
    "triggered",
    "stack",
    "priority",
)

TIMING_WINDOWS: tuple[str, ...] = (
    "cleanup_step",
    "end_step",
    "main_phase",
    "combat_damage_step",
    "stack_resolution",
)

STACK_BEHAVIOR = "lifo"
APNAP_ORDER = True
REPLACEMENT_BEFORE_SBA = True
