"""Legalidade temporal (degradação ao longo do tempo)."""

from __future__ import annotations

from typing import Any


def temporal_legality_tracking_stub(series: list[str]) -> dict[str, Any]:
    return {"states": series, "degraded": "illegal" in series}
