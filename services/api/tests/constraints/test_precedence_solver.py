"""Ordenação topológica determinística."""

from app.reasoning.deterministic.precedence_resolver import topological_role_order


def test_topo_deterministic() -> None:
    nodes = ["b", "a", "c"]
    edges = [("a", "b"), ("b", "c")]
    order, ok = topological_role_order(nodes, edges)
    assert ok and order is not None
    assert order.index("a") < order.index("b") < order.index("c")
