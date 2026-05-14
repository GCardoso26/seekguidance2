"""Latência de runtime (ms observados)."""

from __future__ import annotations

from typing import Any

_LAST: dict[str, float] = {}


def record_latency_ms(name: str, ms: float) -> None:
    _LAST[name] = ms


def latency_snapshot() -> dict[str, Any]:
    return {"latency_ms": dict(_LAST)}
