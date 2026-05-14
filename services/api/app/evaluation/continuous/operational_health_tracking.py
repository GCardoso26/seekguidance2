"""Saúde operacional agregada (continuous eval V2)."""

from __future__ import annotations

from typing import Any


def operational_health_bundle(**parts: Any) -> dict[str, Any]:
    return {"parts": sorted(parts.keys()), "raw": parts}
