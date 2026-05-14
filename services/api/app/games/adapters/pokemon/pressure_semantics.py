"""Pressão Pokémon — modelo de pilha simplificado / efeitos adiados."""

from __future__ import annotations

from typing import Any


def delayed_effect_window_stub(has_delay: bool) -> dict[str, Any]:
    return {"delayed": has_delay, "resolution": "between_turns_stub"}


def turn_state_pressure(turn_index: int) -> dict[str, Any]:
    return {"turn": turn_index, "complexity": min(1.0, 0.1 * turn_index)}
