"""Traços estruturados de raciocínio (OpenTelemetry-ready)."""

from __future__ import annotations

from collections.abc import Iterator
from contextlib import contextmanager
from typing import Any


@contextmanager
def trace_reasoning_span(name: str, attributes: dict[str, Any] | None = None) -> Iterator[dict[str, Any]]:
    span: dict[str, Any] = {"name": name, "attributes": dict(attributes or {})}
    try:
        yield span
    finally:
        span["closed"] = True
