"""OpenTelemetry-friendly runtime counters (no-op safe if OTel absent)."""

from __future__ import annotations

from typing import Any


class RuntimeObservability:
    def __init__(self) -> None:
        self.counters: dict[str, float] = {}
        self.histograms: dict[str, list[float]] = {}

    def incr(self, name: str, value: float = 1.0) -> None:
        self.counters[name] = self.counters.get(name, 0.0) + value

    def observe(self, name: str, value: float) -> None:
        self.histograms.setdefault(name, []).append(value)

    def snapshot(self) -> dict[str, Any]:
        hist = {}
        for k, vals in self.histograms.items():
            if not vals:
                continue
            hist[k] = {
                "count": len(vals),
                "p50": sorted(vals)[len(vals) // 2],
                "max": max(vals),
                "avg": sum(vals) / len(vals),
            }
        return {
            "runtime.counters": dict(self.counters),
            "runtime.histograms": hist,
            "prefixes": ["runtime.", "metric.", "aggregation.", "scheduler.", "cache.", "health."],
        }


OBS = RuntimeObservability()
