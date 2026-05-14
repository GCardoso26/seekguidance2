from app.ontology.gameplay_ontology import build_gameplay_ontology


def test_ontology_engine_nodes() -> None:
    out = build_gameplay_ontology()
    assert "ontology_nodes" in out
    assert "semantic_relationships" in out
