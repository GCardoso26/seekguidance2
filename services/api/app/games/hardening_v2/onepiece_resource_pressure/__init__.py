"""One Piece: DON!! e exaustão."""

from __future__ import annotations


def onepiece_don_pressure(don: int, cost: int) -> dict[str, object]:
    return {"exhaustion_risk": don < cost, "don": don, "cost": cost}
