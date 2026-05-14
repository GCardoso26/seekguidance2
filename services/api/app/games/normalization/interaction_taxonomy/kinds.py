"""Taxonomia de interações."""

from __future__ import annotations

INTERACTION_KINDS: tuple[str, ...] = (
    "stack_push",
    "chain_link",
    "combat_chain_link",
    "prize_reveal",
    "don_modification",
    "ink_exert",
)


def list_interaction_kinds() -> tuple[str, ...]:
    return INTERACTION_KINDS
