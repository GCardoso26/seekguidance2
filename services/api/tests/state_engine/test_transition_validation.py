"""Validação de transições."""

from app.reasoning.state_engine.state_transition_engine import (
    apply_role_transition,
    initial_symbolic_state,
)
from app.reasoning.state_engine.transition_validator import validate_transition


def test_sba_illegal_if_replacement_pending() -> None:
    before = initial_symbolic_state("replacement and sba", "mtg")
    assert before.flags.get("replacement_unapplied")
    after = apply_role_transition(before, "sba", 0)
    v = validate_transition(before, after, "sba", "mtg")
    assert v["transition_valid"] is False
