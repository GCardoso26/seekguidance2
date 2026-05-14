"""Drift comportamental de gameplay."""

from __future__ import annotations


def gameplay_behavior_drift(old_paths: int, new_paths: int) -> float:
    return round(min(1.0, abs(new_paths - old_paths) / max(1, old_paths + new_paths)), 4)
