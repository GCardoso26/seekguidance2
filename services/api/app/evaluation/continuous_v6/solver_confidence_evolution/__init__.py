"""Evolução de confiança do solver."""

from __future__ import annotations

from typing import Any


def solver_confidence_evolution_stub(series: list[float]) -> dict[str, Any]:
    return {"last": series[-1] if series else 0.0, "len": len(series)}
