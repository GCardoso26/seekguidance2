"""Contexto de sandbox (isolamento + caps)."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class SandboxContext:
    session_id: str
    events: list[dict[str, Any]] = field(default_factory=list)

    def record(self, ev: dict[str, Any]) -> None:
        self.events.append(ev)
