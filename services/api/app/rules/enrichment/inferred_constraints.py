"""Constraints inferidas automaticamente."""

from __future__ import annotations


def inferred_constraints(tokens: list[str]) -> list[str]:
    out: list[str] = []
    if "instead" in tokens:
        out.append("replacement_legality_guard")
    if "trigger" in tokens:
        out.append("trigger_order_guard")
    return out
