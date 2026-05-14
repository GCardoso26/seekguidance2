"""Export OTEL runtime (liga `configure_otel_runtime`; sem expor SAT ao utilizador)."""

from __future__ import annotations

from typing import Any

from app.core.config import Settings
from app.observability.tracing_runtime import configure_otel_runtime


def build_otel_exporter_config(settings: Settings) -> dict[str, Any]:
    base = configure_otel_runtime(settings)
    return {
        **base,
        "exporter_ready": bool(settings.observability_otel_enabled),
        "assistant_safe": True,
    }
