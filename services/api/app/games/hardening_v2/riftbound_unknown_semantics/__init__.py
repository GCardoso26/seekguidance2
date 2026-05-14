"""Riftbound: mecânicas desconhecidas (hooks)."""

from __future__ import annotations


def riftbound_placeholder_pressure(unknown_tags: int) -> dict[str, object]:
    return {"needs_adapter": unknown_tags > 0, "unknown_tags": unknown_tags}
