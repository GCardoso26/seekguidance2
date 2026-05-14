"""Cenários adversariais de recursão."""

from __future__ import annotations


def recursion_storm_depth(depth: int, cap: int) -> dict[str, object]:
    return {"depth": depth, "cap": cap, "overflow": depth > cap}
