"""Alertas automáticos pós-lançamento (Slack/webhook)."""

from __future__ import annotations

import os
from typing import Any

import httpx
import structlog

logger = structlog.get_logger(__name__)

SLACK_WEBHOOK_URL = os.getenv("SLACK_ALERT_WEBHOOK_URL", "")


async def send_alert(*, channel: str, message: str, metadata: dict[str, Any] | None = None) -> bool:
    """Envia alerta para Slack (ou log se webhook não configurado)."""
    payload = {"text": message, "metadata": metadata or {}}
    if channel == "slack" and SLACK_WEBHOOK_URL:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                r = await client.post(SLACK_WEBHOOK_URL, json={"text": message})
                return r.is_success
        except Exception as exc:
            logger.warning("slack_alert_failed", error=str(exc))
            return False
    logger.info("alert", channel=channel, message=message, metadata=metadata)
    return True


async def check_critical_metrics() -> list[str]:
    """Verifica métricas críticas — integrar com ClickHouse/Grafana em produção."""
    alerts: list[str] = []

    # Placeholders — substituir por queries reais no Mês 1 pós-lançamento
    conversion_rate = float(os.getenv("METRICS_CONVERSION_RATE", "3.0"))
    p95_latency_ms = float(os.getenv("METRICS_P95_LATENCY_MS", "200"))
    error_rate = float(os.getenv("METRICS_ERROR_RATE", "0.5"))

    if conversion_rate < 2.0:
        alerts.append(f"Taxa de conversão caiu para {conversion_rate}% (meta: > 2%)")
    if p95_latency_ms > 500:
        alerts.append(f"P95 latência: {p95_latency_ms}ms (meta: < 500ms)")
    if error_rate > 1.0:
        alerts.append(f"Error rate: {error_rate}% (meta: < 1%)")

    for msg in alerts:
        await send_alert(channel="slack", message=f"🚨 {msg}")

    return alerts
