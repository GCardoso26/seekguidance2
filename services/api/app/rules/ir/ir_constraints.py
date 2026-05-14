"""Constraints em forma IR."""

from __future__ import annotations

from typing import Any


def timing_constraint(window: str, legal: bool = True) -> dict[str, Any]:
    return {"type": "timing", "window": window, "legal": legal}


def zone_constraint(zone: str, requirement: str) -> dict[str, Any]:
    return {"type": "zone", "zone": zone, "requirement": requirement}
