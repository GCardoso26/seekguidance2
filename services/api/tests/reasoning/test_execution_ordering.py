"""Testes de ordenação de execução."""

from app.reasoning.execution.interaction_chain import dummy_hit
from app.reasoning.execution.ordering_engine import build_ordered_steps


def test_cleanup_replacement_order_mtg() -> None:
    q = "replacement effects and state-based actions during cleanup"
    hits = [dummy_hit("614.1"), dummy_hit("704.5")]
    steps = build_ordered_steps(q, hits, "mtg", max_depth=8)
    desc = " ".join(s.description.lower() for s in steps)
    assert "replacement" in desc
    assert "state-based" in desc
