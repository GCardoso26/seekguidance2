"""Funções puras de mutação simbólica."""

from __future__ import annotations


def modify_numeric_field(old: int | None, delta: int) -> int | None:
    if old is None:
        return None
    return old + delta
