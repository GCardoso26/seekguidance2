from app.graph.semantic_rule_graph import build_semantic_rule_graph


def test_semantic_graph() -> None:
    out = build_semantic_rule_graph("603.3b", ["sba_timing"])
    assert "nodes" in out
    assert "edges" in out
