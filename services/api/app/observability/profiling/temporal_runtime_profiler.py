"""Profiler temporal (lineage / janelas determinísticas)."""

from __future__ import annotations

from typing import Any


def temporal_runtime_profile(*, ticks: int, window: int) -> dict[str, Any]:
    return {"ticks": ticks, "window": window, "load_proxy": round(ticks / max(1, window), 4)}
