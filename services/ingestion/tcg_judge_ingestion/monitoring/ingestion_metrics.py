"""Métricas de ingestão (Prometheus-friendly counters)."""

from __future__ import annotations

from typing import Any

_COUNTERS: dict[str, int] = {}


def inc(name: str, n: int = 1) -> None:
    _COUNTERS[name] = _COUNTERS.get(name, 0) + n


_GAUGES: dict[str, float] = {}


def observe(name: str, value: float) -> None:
    _GAUGES[name] = float(value)


def snapshot() -> dict[str, Any]:
    return {"ingestion_counters": dict(_COUNTERS), "ingestion_gauges": dict(_GAUGES)}
