"""Constraints Pokémon (bounded)."""

from __future__ import annotations

MUST_PRECEDE: tuple[tuple[str, str], ...] = (
    ("between_turns", "checkup"),
    ("checkup", "simultaneous_effects"),
    ("simultaneous_effects", "replacement_like"),
)

MUTEX_ROLES: tuple[tuple[str, str], ...] = ()

TIMING_REQUIRES: dict[str, tuple[str, ...]] = {
    "between_turns": ("simultaneous_effects",),
}

MAX_PROPAGATION_STEPS = 24
