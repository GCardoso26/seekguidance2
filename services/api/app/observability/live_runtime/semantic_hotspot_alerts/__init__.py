"""Alertas de hotspots semânticos."""

from __future__ import annotations

from typing import Any


def semantic_hotspot_alerts_stub(label: str, rate: float) -> dict[str, Any]:
    return {"label": label, "alert": rate > 10.0, "rate": rate}
