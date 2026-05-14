"""Estado runtime de um objeto (snapshot parcial)."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class ObjectRuntimeState:
    object_id: str
    fields: dict[str, Any] = field(default_factory=dict)
