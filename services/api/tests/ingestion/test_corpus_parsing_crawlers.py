"""Crawlers_real registry + parsing + validation_real."""

from __future__ import annotations

from tcg_judge_ingestion.corpus.temporal_persistence import CorpusTemporalEdge, edge_to_dict
from tcg_judge_ingestion.crawlers_real.registry import list_game_slugs
from tcg_judge_ingestion.parsing import formal_parse
from tcg_judge_ingestion.validation_real import semantic_coverage_ratio


def test_list_game_slugs() -> None:
    assert "mtg" in list_game_slugs()
    assert len(list_game_slugs()) == 8


def test_formal_parse_slots() -> None:
    out = formal_parse("mtg", "priority stack replacement")
    assert "formal_slots" in out
    assert out["formal_slots"]["chain_stack"] or out["formal_slots"]["precedence"]


def test_temporal_edge_dict() -> None:
    e = CorpusTemporalEdge("d1", "2024-01-01", None, None, None, "h1", None)
    d = edge_to_dict(e)
    assert d["document_id"] == "d1"


def test_validation_real_coverage() -> None:
    r = semantic_coverage_ratio({"timing": [1], "windows": [], "constraints": [], "dependencies": []})
    assert 0 < r < 1
