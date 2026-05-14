"""Timestamps monotónicos por objeto (simbólico)."""

from __future__ import annotations


class TimestampAssigner:
    def __init__(self) -> None:
        self._next = 1

    def stamp(self) -> int:
        ts = self._next
        self._next += 1
        return ts
