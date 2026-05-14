"""Validação temporal monótona em ticks de replay."""

from __future__ import annotations


def validate_temporal_monotonic(ticks: list[int]) -> dict[str, object]:
    ok = all(ticks[i] <= ticks[i + 1] for i in range(len(ticks) - 1)) if ticks else True
    return {"ok": ok, "len": len(ticks)}
