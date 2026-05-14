from app.games.semantic_core.abstract_semantics import semantic_adapter_capabilities


def test_cross_tcg_semantics() -> None:
    mtg = semantic_adapter_capabilities("mtg")
    ygo = semantic_adapter_capabilities("ygo")
    assert "REPLACEMENT_SYSTEM" in mtg
    assert "CHAIN_SYSTEM" in ygo
