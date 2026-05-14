"""Camadas de abstração temporal (rótulos)."""

from __future__ import annotations

TIMING_LAYERS: tuple[str, ...] = (
    "pre_game",
    "turn_structure",
    "priority_window",
    "cleanup_automatic",
    "special_action",
)


def layer_index(name: str) -> int | None:
    try:
        return TIMING_LAYERS.index(name)
    except ValueError:
        return None
