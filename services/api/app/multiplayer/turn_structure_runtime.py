"""Estrutura de turno (stub)."""

from __future__ import annotations

from typing import Any


def default_turn_structure() -> dict[str, Any]:
    return {"phases": ["beginning", "main1", "combat", "main2", "ending"]}
