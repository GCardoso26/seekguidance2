"""Estado simbólico e canónica."""

from app.reasoning.state_engine.symbolic_state import SymbolicGameState


def test_canonical_key_stable() -> None:
    a = SymbolicGameState("S0", {"Z": frozenset({"x"})}, {"f": True})
    b = SymbolicGameState("S0", {"Z": frozenset({"x"})}, {"f": True})
    assert a.canonical_key() == b.canonical_key()
