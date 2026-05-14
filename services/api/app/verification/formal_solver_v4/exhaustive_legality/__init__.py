"""Exaustão de legalidade (saturação bounded)."""

from __future__ import annotations

from typing import Any


def legality_saturation_stub(states: int, cap: int) -> dict[str, Any]:
    return {"saturated": states >= cap, "states": states, "cap": cap}
