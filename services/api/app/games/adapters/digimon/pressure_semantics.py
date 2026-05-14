"""Pressão Digimon — memória / evolução."""

from __future__ import annotations

from typing import Any


def memory_gauge_pressure(used: int, cap: int = 10) -> dict[str, Any]:
    return {"gauge_ratio": round(used / max(1, cap), 3)}


def evolution_timing_stub(from_level: int, to_level: int) -> dict[str, Any]:
    return {"delta": to_level - from_level, "timing_window": "main_stub"}
