"""Constraints One Piece (bounded)."""

from __future__ import annotations

MUST_PRECEDE: tuple[tuple[str, str], ...] = (
    ("event", "replacement_like"),
    ("replacement_like", "triggered"),
    ("triggered", "counter_window"),
    ("counter_window", "resolution"),
)

MUTEX_ROLES: tuple[tuple[str, str], ...] = ()

TIMING_REQUIRES: dict[str, tuple[str, ...]] = {}

MAX_PROPAGATION_STEPS = 24
