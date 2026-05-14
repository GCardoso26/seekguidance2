"""Geradores de invariantes para fuzz/property."""

from __future__ import annotations


def generate_invariant_state(seed: int) -> dict[str, int]:
    return {"objects": seed % 5 + 1, "conflicts": seed % 3, "queue": seed % 8}
