"""Pontes OpenTelemetry (opcional — sem dependência hard)."""

from __future__ import annotations

from typing import Any


def configure_tracing(*, enabled: bool, endpoint: str | None) -> dict[str, Any]:
    """Regista intenção de tracing; exportador real via sidecar/collector."""
    if not enabled:
        return {"otel": "disabled"}
    return {"otel": "hooks_ready", "endpoint": endpoint or "unset"}
