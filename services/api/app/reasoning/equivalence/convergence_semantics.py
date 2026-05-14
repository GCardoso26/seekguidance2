"""Convergência semântica entre caminhos (wrapper)."""

from __future__ import annotations

from app.reasoning.equivalence.semantic_equivalence import semantic_hash
from app.reasoning.equivalence.state_normalizer import normalize_registry_objects
from app.reasoning.semantic_objects.gameplay_object import GameplayObject


def convergence_key_for_objects(objs: list[GameplayObject]) -> str:
    norm = normalize_registry_objects(objs)
    return semantic_hash(norm)
