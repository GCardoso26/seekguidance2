"""Agrega contagem de estados equivalentes por chave semântica."""

from __future__ import annotations

from collections import Counter

from app.reasoning.equivalence.convergence_semantics import convergence_key_for_objects
from app.reasoning.semantic_objects.gameplay_object import GameplayObject


def count_equivalent_groups(object_sets: list[list[GameplayObject]]) -> tuple[int, dict[str, int]]:
    keys = [convergence_key_for_objects(objs) for objs in object_sets]
    c = Counter(keys)
    merged = sum(1 for _k, v in c.items() if v > 1)
    return merged, dict(c)
