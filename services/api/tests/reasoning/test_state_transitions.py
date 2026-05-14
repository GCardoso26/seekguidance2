"""Testes de transição de estado."""

from app.reasoning.simulation.state_transition import initial_state, terminal_state


def test_initial_cleanup() -> None:
    s = initial_state("cleanup step question", "mtg")
    assert "cleanup" in s.label.lower() or "cleanup" in (s.notes or "").lower()


def test_terminal() -> None:
    assert terminal_state().label
