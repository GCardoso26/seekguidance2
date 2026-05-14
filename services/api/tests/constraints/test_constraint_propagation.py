"""Propagação de constraints e motor auxiliar."""

from app.reasoning.constraints.constraint_engine import run_constraint_engine


def test_propagation_contains_replacement_labels() -> None:
    out = run_constraint_engine(["event", "replacement", "sba"], "mtg", {"window": "cleanup_step"})
    prop = out["propagation_chain"]
    assert any("replacement" in p for p in prop)
