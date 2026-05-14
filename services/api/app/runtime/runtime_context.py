"""Contexto isolado por sessão de simulação (reasoning runtime)."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class RuntimeContext:
    session_id: str
    game_slug: str
    caps: dict[str, int] = field(default_factory=dict)
    metadata: dict[str, Any] = field(default_factory=dict)
