"""Sinais de saúde runtime móvel v2 (stub)."""

from __future__ import annotations

from typing import Any


def mobile_runtime_health_signals_v2_stub(device_id: str) -> dict[str, Any]:
    return {
        "device_id": device_id,
        "runtime_health_summary": {"battery_safe": True, "storage_headroom": True},
        "assistant_notes": ["mobile_runtime_health_v2: métricas agregadas; sem PII."],
    }
