"""Pokémon — efeitos adiados / janelas (stub, soft normalization)."""

from __future__ import annotations

from typing import Any


def pokemon_delayed_effects_stub(stack_depth: int) -> dict[str, Any]:
    return {
        "stack_depth": stack_depth,
        "delayed_window_risk": stack_depth > 4,
        "assistant_notes": ["Pokémon mantém semântica própria; não colapsar para stack genérico."],
    }
