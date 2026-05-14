"""Tracking de explosão de ramos."""

from __future__ import annotations


def branch_explosion_tracking(branches: int, cap: int) -> dict[str, object]:
    return {"over_cap": branches > cap, "branches": branches, "cap": cap}
