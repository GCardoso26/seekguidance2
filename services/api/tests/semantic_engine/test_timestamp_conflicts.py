"""Timestamps em conflito semântico."""

from app.reasoning.semantic_conflicts.semantic_conflict_detector import detect_semantic_conflicts


def test_timestamp_conflict_detected() -> None:
    c = detect_semantic_conflicts(layer_dependency_pairs=[("a", None)], timestamp_pairs_same_layer=[(1, 1)])
    assert any(x.get("type") == "timestamp_conflict_same_effect" for x in c)
