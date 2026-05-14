from tcg_judge_ingestion.chunker.hierarchical_mtg import chunk_mtg_hierarchical, parent_rule_path


def test_parent_rule_path_mtg_subrules() -> None:
    assert parent_rule_path("603.3a") == "603.3"
    assert parent_rule_path("603.3") == "603"
    assert parent_rule_path("603") is None


def test_chunker_preserves_rule_lines() -> None:
    raw = """
500. General
500.1. First rule line for testing.
500.2. Second rule line.
603. Triggered Abilities
603.1. Triggered abilities have a trigger condition and an effect.
603.2. Whenever a game event matches a triggered ability's trigger event, that ability triggers.
603.3a Some nested case for lettered subrule.
""".strip()
    chunks = chunk_mtg_hierarchical(raw, document_title="Fake CR")
    paths = {c.rule_path for c in chunks if c.rule_path}
    assert "500.1" in paths or any("500.1" in (c.text or "") for c in chunks)
    assert "603.3a" in paths or any("603.3a" in c.text for c in chunks)


def test_fallback_when_no_rule_pattern() -> None:
    text = "Just narrative text without numeric headings.\n" * 5
    chunks = chunk_mtg_hierarchical(text, document_title="Blob")
    assert len(chunks) == 1
    assert chunks[0].metadata.get("fallback") is True
