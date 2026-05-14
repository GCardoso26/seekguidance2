"""Inconsistência temporal (ordenação)."""

from __future__ import annotations


def temporal_inconsistency_detection(dates_iso: list[str]) -> dict[str, object]:
    s = sorted(dates_iso)
    return {"ok": dates_iso == s, "sorted": s}
