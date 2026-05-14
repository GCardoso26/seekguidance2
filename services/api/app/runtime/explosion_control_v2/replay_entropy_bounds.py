"""Limites de entropia de replay (bounds declarativos)."""

from __future__ import annotations


def replay_entropy_bounds(unique_ratio: float, *, floor: float = 0.15) -> dict[str, object]:
    ur = max(0.0, min(1.0, unique_ratio))
    return {"within_bounds": ur >= floor, "unique_ratio": ur, "floor": floor}
