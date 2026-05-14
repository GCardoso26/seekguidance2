"""Observabilidade leve no dispositivo (stub)."""

from __future__ import annotations

from typing import Any


def mobile_observability_stub(battery_low: bool) -> dict[str, Any]:
    return {
        "battery_low": battery_low,
        "low_bandwidth": True,
        "assistant_notes": ["Sem dependência exclusiva de Prometheus/Grafana no dispositivo."],
    }
