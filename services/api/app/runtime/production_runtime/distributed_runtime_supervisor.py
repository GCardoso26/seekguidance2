"""Supervisor de runtime distribuído."""

from __future__ import annotations


def supervisor_status(*, heartbeats_ok: int, total: int) -> dict[str, float]:
    ratio = heartbeats_ok / max(1, total)
    return {"healthy_ratio": round(ratio, 4)}
