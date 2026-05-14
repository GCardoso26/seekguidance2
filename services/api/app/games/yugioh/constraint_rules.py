"""Constraints Yu-Gi-Oh! (bounded)."""

from __future__ import annotations

MUST_PRECEDE: tuple[tuple[str, str], ...] = (
    ("activation_window", "chain_build"),
    ("segoc_ordering", "chain_resolution"),
    ("chain_build", "chain_resolution"),
    ("chain_resolution", "trigger_timing"),
)

MUTEX_ROLES: tuple[tuple[str, str], ...] = ()

TIMING_REQUIRES: dict[str, tuple[str, ...]] = {
    "open_window": ("chain_build", "chain_resolution"),
}

MAX_PROPAGATION_STEPS = 28
