"""Ponte observabilidade live ↔ config AWS/OTEL (opcional)."""

from __future__ import annotations

from typing import Any

from app.core.config import get_settings


def aws_observability_bridge_stub() -> dict[str, Any]:
    s = get_settings()
    return {
        "otel_endpoint": s.observability_otel_endpoint,
        "otel_enabled": s.observability_otel_enabled,
        "cloudwatch_log_group_api": s.cloudwatch_log_group_api,
        "aws_xray_enabled": s.aws_xray_enabled,
        "prometheus_remote_write_url": s.prometheus_remote_write_url,
        "grafana_workspace_url": s.grafana_workspace_url,
        "assistant_notes": [
            "Integrar exporters reais quando AWS_PLATFORM_ENABLED e endpoints definidos.",
            "Pipelines reasoning_v1…v11 não são alterados por este stub.",
        ],
    }
