"""Entidades simbólicas (identificadores opacos, sem objetos de jogo reais)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

EntityKind = Literal["object", "player", "zone_marker", "effect_frame", "abstract_event"]


@dataclass(frozen=True)
class SymbolicEntity:
    entity_id: str
    kind: EntityKind
    zone: str | None = None
