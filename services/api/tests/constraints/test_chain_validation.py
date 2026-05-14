"""Validação formal de cadeia."""

from app.reasoning.chain_validator import validate_formal_chain


def test_valid_chain_scores_high() -> None:
    roles = ["event", "replacement", "sba", "triggered", "stack", "priority"]
    timing = {"window": "stack_resolution", "priority_pass": True}
    out = validate_formal_chain(roles, "mtg", timing)
    assert out["chain_valid"] is True
    assert out["validation_score"] >= 0.9
