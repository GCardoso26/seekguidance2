"""Normalização de estados de objeto para comparação."""

from __future__ import annotations

from typing import Any

from app.reasoning.semantic_objects.gameplay_object import GameplayObject


def normalize_object(obj: GameplayObject) -> dict[str, Any]:
    return {
        "t": obj.object_type,
        "c": obj.controller,
        "z": obj.zone,
        "p": obj.power,
        "u": obj.toughness,
        "m": sorted(obj.modifiers),
        "f": sorted(obj.state_flags),
        "e": sorted(obj.continuous_effect_ids),
        "ts": sorted(obj.timestamps),
        "l": obj.lineage_id or obj.object_id,
    }


def normalize_registry_objects(objs: list[GameplayObject]) -> dict[str, Any]:
    items = sorted((normalize_object(o) for o in objs), key=lambda x: str(x.get("l", "")))
    return {"objects": items}
