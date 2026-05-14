"""Digimon: memory gauge."""

from __future__ import annotations


def digimon_memory_pressure(gauge: int, cap: int) -> dict[str, object]:
    return {"near_cap": gauge >= cap - 1, "gauge": gauge}
