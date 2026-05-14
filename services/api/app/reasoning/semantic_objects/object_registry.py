"""Registo de objetos semânticos (bounded)."""

from __future__ import annotations

from app.reasoning.semantic_objects.gameplay_object import GameplayObject

MAX_OBJECTS = 32


class ObjectRegistry:
    def __init__(self) -> None:
        self._objects: dict[str, GameplayObject] = {}

    def register(self, obj: GameplayObject) -> None:
        if len(self._objects) >= MAX_OBJECTS:
            return
        self._objects[obj.object_id] = obj

    def get(self, object_id: str) -> GameplayObject | None:
        return self._objects.get(object_id)

    def all_objects(self) -> list[GameplayObject]:
        return list(self._objects.values())

    def move_zone(self, object_id: str, new_zone: str) -> bool:
        o = self._objects.get(object_id)
        if o is None:
            return False
        self._objects[object_id] = GameplayObject(
            object_id=o.object_id,
            object_type=o.object_type,
            controller=o.controller,
            zone=new_zone,
            power=o.power,
            toughness=o.toughness,
            continuous_effect_ids=o.continuous_effect_ids,
            timestamps=o.timestamps,
            modifiers=o.modifiers,
            state_flags=o.state_flags + ("zone_changed",),
            lineage_id=o.lineage_id or o.object_id,
            meta=dict(o.meta),
        )
        return True
