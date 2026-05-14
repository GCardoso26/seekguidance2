"""Testes do grafo de raciocínio."""

from app.reasoning.engine import run_reasoning_engine
from app.reasoning.execution.interaction_chain import dummy_hit


def test_graph_has_nodes_and_edges() -> None:
    q = "layers and dependency continuous effects"
    hits = [dummy_hit("613.1", "layer dependency")]
    r = run_reasoning_engine(q, hits, "mtg", settings=None)
    g = r.metadata.get("reasoning_graph") or {}
    assert g.get("nodes")
    assert g.get("edges")
