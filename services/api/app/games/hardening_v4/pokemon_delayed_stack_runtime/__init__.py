"""Pokémon — stack simplificado e efeitos adiados."""

from __future__ import annotations

from typing import Any


def pokemon_delayed_stack_runtime_stub(stack_depth: int) -> dict[str, Any]:
    return {
        "stack_depth": stack_depth,
        "assistant_notes": ["Delayed effect resolution; sem stack genérico de MTG."],
    }
