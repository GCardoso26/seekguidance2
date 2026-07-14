"""Telemetria AI — sem dados sensíveis."""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any

import structlog

logger = structlog.get_logger(__name__)

_TELEMETRY_BUFFER: list[dict[str, Any]] = []
_MAX_BUFFER = 200


@dataclass
class AiTelemetryEvent:
    event_type: str
    provider_id: str
    prompt_id: str
    prompt_version: str
    latency_ms: int
    success: bool
    input_tokens: int | None = None
    output_tokens: int | None = None
    estimated_cost_usd: float | None = None
    error: str | None = None
    store_id: str | None = None
    extra: dict[str, Any] = field(default_factory=dict)


def record_ai_event(event: AiTelemetryEvent) -> None:
    payload = {
        "event_type": event.event_type,
        "provider_id": event.provider_id,
        "prompt_id": event.prompt_id,
        "prompt_version": event.prompt_version,
        "latency_ms": event.latency_ms,
        "success": event.success,
        "input_tokens": event.input_tokens,
        "output_tokens": event.output_tokens,
        "estimated_cost_usd": event.estimated_cost_usd,
        "error": event.error,
        "store_id": event.store_id,
    }
    _TELEMETRY_BUFFER.append(payload)
    if len(_TELEMETRY_BUFFER) > _MAX_BUFFER:
        _TELEMETRY_BUFFER.pop(0)
    logger.info("seller_ai_telemetry", **{k: v for k, v in payload.items() if v is not None})


class AiTelemetrySpan:
    def __init__(self, *, event_type: str, provider_id: str, prompt_id: str, prompt_version: str, store_id: str | None):
        self._started = time.perf_counter()
        self._event = AiTelemetryEvent(
            event_type=event_type,
            provider_id=provider_id,
            prompt_id=prompt_id,
            prompt_version=prompt_version,
            latency_ms=0,
            success=True,
            store_id=store_id,
        )

    def __enter__(self) -> AiTelemetrySpan:
        return self

    def __exit__(self, exc_type, exc, _tb) -> None:
        self._event.latency_ms = int((time.perf_counter() - self._started) * 1000)
        if exc:
            self._event.success = False
            self._event.error = str(exc)[:200]
        record_ai_event(self._event)

    def set_tokens(self, input_tokens: int | None, output_tokens: int | None, cost: float | None = None) -> None:
        self._event.input_tokens = input_tokens
        self._event.output_tokens = output_tokens
        self._event.estimated_cost_usd = cost


def get_recent_telemetry(limit: int = 50) -> list[dict[str, Any]]:
    return list(_TELEMETRY_BUFFER[-limit:])
