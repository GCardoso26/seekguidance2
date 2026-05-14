"""Layers."""

from app.reasoning.continuous.layer_engine import order_continuous_effects
from app.reasoning.semantic_objects.continuous_effects import ContinuousEffect


def test_layer_order_pt_before_dup_dependency() -> None:
    ce1 = ContinuousEffect("e1", "power_toughness", "obj", None)
    ce2 = ContinuousEffect("e2", "copiable_values", "obj", None)
    ordered = order_continuous_effects([(ce1, 2), (ce2, 1)])
    assert ordered[0][0].layer_subcategory == "copiable_values"
