"""Consultas de semântica histórica."""

from __future__ import annotations

from typing import Any


def semantics_by_period(memory: list[dict[str, Any]], period: str) -> list[dict[str, Any]]:
    return [m for m in memory if str(m.get("period", "")) == period]
