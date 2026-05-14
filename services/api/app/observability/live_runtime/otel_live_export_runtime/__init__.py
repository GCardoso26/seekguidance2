"""Export OTEL live (stub de integração)."""

from __future__ import annotations

from typing import Any


def otel_live_export_runtime_stub(endpoint: str) -> dict[str, Any]:
    return {"endpoint": endpoint, "assistant_notes": ["Ligar a collector real em deploy."]}
