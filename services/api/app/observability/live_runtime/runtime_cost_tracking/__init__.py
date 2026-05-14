"""Custo de runtime (agregado assistente)."""

from __future__ import annotations

from typing import Any


def runtime_cost_tracking_stub(cpu_units: float) -> dict[str, Any]:
    return {"cpu_units": cpu_units, "degraded": cpu_units > 100.0}
