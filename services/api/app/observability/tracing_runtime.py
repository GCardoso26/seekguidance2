"""Tracing operacional (correlação, sampling, árvores lógicas) — OTEL lazy."""

from __future__ import annotations

import random
import uuid
from contextvars import ContextVar
from dataclasses import dataclass, field
from typing import Any

from app.core.config import Settings

_trace_ctx: ContextVar[str | None] = ContextVar("tcg_trace_id", default=None)


def new_trace_id() -> str:
    return str(uuid.uuid4())


def get_trace_id() -> str | None:
    return _trace_ctx.get()


def bind_trace(trace_id: str | None) -> Any:
    return _trace_ctx.set(trace_id)


def reset_trace(token: Any) -> None:
    _trace_ctx.reset(token)


def should_sample(settings: Settings) -> bool:
    rate = max(0.0, min(1.0, float(settings.observability_trace_sample_rate)))
    if rate >= 1.0:
        return True
    if rate <= 0.0:
        return False
    return random.random() < rate


@dataclass
class SpanEvent:
    name: str
    attrs: dict[str, Any] = field(default_factory=dict)


def build_span_tree(root: str, children: list[str]) -> dict[str, Any]:
    return {"root": root, "children": children, "trace_id": get_trace_id()}


def configure_otel_runtime(settings: Settings) -> dict[str, Any]:
    """Prepara exportador; sem `opentelemetry-sdk` instalado mantém modo atributos-only."""
    if not settings.observability_otel_enabled:
        return {"otel": "disabled", "sample_rate": settings.observability_trace_sample_rate}
    try:
        from opentelemetry import trace as otel_trace  # type: ignore[import-not-found]

        _ = otel_trace.get_tracer(__name__)
        return {"otel": "sdk_present", "endpoint": settings.observability_otel_endpoint}
    except Exception:
        return {"otel": "hooks_only", "endpoint": settings.observability_otel_endpoint}
