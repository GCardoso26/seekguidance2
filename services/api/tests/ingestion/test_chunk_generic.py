from tcg_judge_ingestion.chunker.hierarchical_generic import chunk_generic_hierarchical


def test_generic_splits_long_unstructured_text() -> None:
    para = "Word " * 400
    text = "\n\n".join([para] * 8)
    chunks = chunk_generic_hierarchical(text, document_title="Test Doc")
    assert len(chunks) >= 2
    assert all(c.text for c in chunks)
