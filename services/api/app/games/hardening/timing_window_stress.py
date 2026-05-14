"""Stress de janelas de timing."""

from __future__ import annotations


def timing_window_pressure(overlaps: int) -> dict[str, object]:
    return {"pressure": overlaps > 2, "overlaps": overlaps}
