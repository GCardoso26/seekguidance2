from app.rules.enrichment.semantic_enrichment import enrich_semantics


def test_runtime_annotations() -> None:
    out = enrich_semantics(["priority", "instead"])
    assert "runtime_annotations" in out
