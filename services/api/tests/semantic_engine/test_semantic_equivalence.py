"""Equivalência."""

from app.reasoning.equivalence.equivalent_state_merger import count_equivalent_groups
from app.reasoning.semantic_objects.gameplay_object import GameplayObject


def test_equivalent_duplicate_paths() -> None:
    o = GameplayObject("a", "creature", "p", "battlefield")
    merged, _ = count_equivalent_groups([[o], [o]])
    assert merged >= 1
