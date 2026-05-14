"""Eventos de gameplay simbólicos."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class GameplayEvent:
    name: str
    caused_by: str
    payload: dict[str, Any] = field(default_factory=dict)
