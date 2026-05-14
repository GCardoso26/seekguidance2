"""Objeto de gameplay semântico (bounded, sem motor de mesa)."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class GameplayObject:
    object_id: str
    object_type: str
    controller: str
    zone: str
    power: int | None = None
    toughness: int | None = None
    continuous_effect_ids: tuple[str, ...] = ()
    timestamps: tuple[int, ...] = ()
    modifiers: tuple[str, ...] = ()
    state_flags: tuple[str, ...] = ()
    lineage_id: str = ""
    meta: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "object_id": self.object_id,
            "object_type": self.object_type,
            "controller": self.controller,
            "zone": self.zone,
            "power": self.power,
            "toughness": self.toughness,
            "continuous_effects": list(self.continuous_effect_ids),
            "timestamps": list(self.timestamps),
            "modifiers": list(self.modifiers),
            "state_flags": list(self.state_flags),
            "lineage_id": self.lineage_id or self.object_id,
        }
