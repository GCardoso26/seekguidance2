"""Estados ilegais adicionais."""

from app.reasoning.state_engine.state_legality import validate_state_legality
from app.reasoning.state_engine.symbolic_state import SymbolicGameState


def test_impossible_chain_window() -> None:
    s = SymbolicGameState("S", {}, {"impossible_chain_window": True})
    leg = validate_state_legality(s, "mtg")
    assert leg["timing_legal"] is False
