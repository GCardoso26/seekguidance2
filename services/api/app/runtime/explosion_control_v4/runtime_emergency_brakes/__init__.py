"""Freios de emergência em runtime."""

from __future__ import annotations

from typing import Any


def runtime_emergency_brakes_stub(cpu_pressure: float, queue_depth: int) -> dict[str, Any]:
    trigger = cpu_pressure > 0.9 or queue_depth > 10_000
    return {
        "cpu_pressure": cpu_pressure,
        "queue_depth": queue_depth,
        "triggered": trigger,
        "assistant_notes": ["Modo degradado: respostas mais curtas e menos ramificação, sem alterar contratos."],
    }
