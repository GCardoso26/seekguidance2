from app.ontology.semantic_taxonomy_evolution import taxonomy_shift


def test_ontology_evolution_shift() -> None:
    score = taxonomy_shift(["a", "b"], ["a", "c"])
    assert score > 0.0
