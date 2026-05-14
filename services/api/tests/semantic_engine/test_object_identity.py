"""Identidade."""

from app.reasoning.semantic_objects.object_identity import lineage_for


def test_lineage_stable() -> None:
    assert lineage_for("obj_creature_1").startswith("lineage::")
