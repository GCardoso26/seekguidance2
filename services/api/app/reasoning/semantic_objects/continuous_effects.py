"""Efeitos contínuos simbólicos (MTG-style layers / dependências)."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ContinuousEffect:
    effect_id: str
    layer_subcategory: str
    source_object_id: str
    dependency_of: str | None = None
