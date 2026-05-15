"""Observabilidade runtime móvel v2 (stub)."""

from __future__ import annotations

from typing import Any


def mobile_runtime_observability_v2_stub(device_id: str) -> dict[str, Any]:
    return {
        "device_id": device_id,
        "otel_safe_metrics": ["tcg_judge.mobile.sync.queue_depth"],
        "assistant_notes": ["mobile_runtime_observability_v2: Prometheus/OTEL opcionais."],
    }
