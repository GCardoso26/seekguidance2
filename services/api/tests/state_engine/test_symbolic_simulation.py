"""Simulação simbólica."""

from app.reasoning.simulation.symbolic_simulation import run_symbolic_simulation


def test_symbolic_simulation_runs() -> None:
    out = run_symbolic_simulation(["event", "replacement"], "q", "mtg")
    assert out["n_states"] >= 2
