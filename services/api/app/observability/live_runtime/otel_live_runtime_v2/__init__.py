"""OpenTelemetry live runtime v2 (exportação resumida)."""

from __future__ import annotations

from typing import Any


def otel_live_runtime_v2_stub(service: str) -> dict[str, Any]:
    return {
        "service": service,
        "otel_live_runtime_v2": True,
        "assistant_notes": ["Spans resumidos; sem payloads sensíveis."],
    }
