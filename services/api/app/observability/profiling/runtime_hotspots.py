"""Hotspots operacionais (replay, grafo, ontologia, retrieval, ramos)."""

from __future__ import annotations

from typing import Any

from app.observability.profiling.hotspots import profile_region


def runtime_hotspot_report(regions: list[str]) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for name in regions:
        with profile_region(name) as m:
            m["synthetic_load_ms"] = 0.0
        out[name] = m
    return {"hotspots": out}
