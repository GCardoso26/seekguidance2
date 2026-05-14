"""Grafo formal de constraints."""

from app.reasoning.constraints.constraint_graph import build_formal_constraint_graph


def test_graph_has_precedence_edges() -> None:
    g = build_formal_constraint_graph("mtg")
    types = {e["edge_type"] for e in g["edges"]}
    assert "precedence" in types
