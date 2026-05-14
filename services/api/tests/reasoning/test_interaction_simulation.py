"""Testes de simulação."""

from app.reasoning.engine import run_reasoning_engine
from app.reasoning.execution.interaction_chain import dummy_hit


def test_simulation_trace_non_empty() -> None:
    q = "How do replacement effects interact with SBA during cleanup?"
    hits = [dummy_hit("614.1", "replacement instead"), dummy_hit("704.5", "state-based actions")]
    r = run_reasoning_engine(q, hits, "mtg", settings=None)
    assert r.simulation.steps
    assert r.simulation.before_state.label
