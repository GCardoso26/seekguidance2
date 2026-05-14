from __future__ import annotations

from app.games.normalization import (
    describe_cross_tcg_bridge,
    equivalence_hint,
    ontology_for_game,
    retrieval_tuning,
    timing_labels,
)


def test_cross_tcg_bridge() -> None:
    d = describe_cross_tcg_bridge("ordered_resolution")
    assert "mtg:stack" in d["references"]


def test_equivalence_soft() -> None:
    h = equivalence_hint("mtg", "stack")
    assert h.get("target_game") == "yugioh"


def test_ontology_registry() -> None:
    o = ontology_for_game("mtg")
    assert "stack" in o["zones"]


def test_timing_labels_ygo() -> None:
    assert "segoc" in timing_labels("yugioh")


def test_retrieval_tuning() -> None:
    t = retrieval_tuning("fab")
    assert t["graph_scale"] >= 1.0
