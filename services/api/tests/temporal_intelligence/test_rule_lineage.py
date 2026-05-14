from app.rules.lineage.rule_lineage_graph import build_lineage_graph


def test_rule_lineage_graph() -> None:
    out = build_lineage_graph("legend_rule_v2", ["legend_rule_v1"], ["legend_rule_modern"])
    assert "nodes" in out and "edges" in out
