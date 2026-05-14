"""Export de trace real (metadados + OTEL config)."""

from __future__ import annotations

from typing import Any

from app.core.config import Settings
from app.observability.runtime_tracing.otel_runtime_exporter import build_otel_exporter_config


def export_runtime_trace_meta(settings: Settings, *, trace_id: str) -> dict[str, Any]:
    cfg = build_otel_exporter_config(settings)
    return {**cfg, "trace_id": trace_id}
