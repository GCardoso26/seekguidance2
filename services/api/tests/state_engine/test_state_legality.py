"""Legalidade de estado."""

from app.reasoning.state_engine.state_legality import validate_state_legality
from app.reasoning.state_engine.symbolic_state import SymbolicGameState


def test_contradictory_creature_illegal() -> None:
    s = SymbolicGameState(
        "Sx",
        {"BATTLEFIELD": frozenset()},
        {"creature_destroyed": True, "creature_alive_same_ref": True},
    )
    leg = validate_state_legality(s, "mtg")
    assert leg["state_valid"] is False
    assert leg["illegal_conditions"]
