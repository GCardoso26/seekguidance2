"""Constraints Lorcana (bounded)."""

from __future__ import annotations

MUST_PRECEDE: tuple[tuple[str, str], ...] = (
    ("cost", "effect"),
    ("effect", "replacement_like"),
    ("replacement_like", "state_check"),
    ("state_check", "queue_resolution"),
)

MUTEX_ROLES: tuple[tuple[str, str], ...] = ()

TIMING_REQUIRES: dict[str, tuple[str, ...]] = {}

MAX_PROPAGATION_STEPS = 24
