"""Efeitos contínuos aplicados."""

from app.reasoning.continuous.effect_application import apply_ordered_continuous
from app.reasoning.semantic_objects.continuous_effects import ContinuousEffect


def test_application_order() -> None:
    ce = ContinuousEffect("x", "power_toughness", "o", None)
    out = apply_ordered_continuous([(ce, 1)])
    assert out["application_order"] == ["x"]
