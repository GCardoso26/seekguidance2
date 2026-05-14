"""Tipos auxiliares para caminhos aceites / rejeitados."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class RejectedPath:
    path: str
    reason: str

    def to_dict(self) -> dict[str, str]:
        return {"path": self.path, "reason": self.reason}
