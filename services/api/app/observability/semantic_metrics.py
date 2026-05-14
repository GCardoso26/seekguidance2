"""Métricas semânticas (counters; integração Prometheus opcional)."""

from __future__ import annotations

from typing import Any

_COUNTERS: dict[str, int] = {}


def bump_counter(name: str, delta: int = 1) -> None:
    _COUNTERS[name] = _COUNTERS.get(name, 0) + delta


def snapshot_counters() -> dict[str, Any]:
    return {"counters": dict(_COUNTERS), "exporter": "inline_dict"}
