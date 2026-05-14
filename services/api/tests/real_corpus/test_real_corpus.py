"""Corpus real (ingestão)."""

from __future__ import annotations

from tcg_judge_ingestion.real_corpus import edge_case_catalog_stub, replay_case_stub, ruling_lineage_edges
from tcg_judge_ingestion.real_corpus.edge_case_corpus import paradox_hint_stub
from tcg_judge_ingestion.real_corpus.historical_rulings import ruling_confidence_engine
from tcg_judge_ingestion.real_corpus.tournament_archives import parse_investigation_stub


def test_lineage() -> None:
    assert len(ruling_lineage_edges(["b", "a"])) == 1


def test_edge_catalog() -> None:
    assert "paradox" in edge_case_catalog_stub()


def test_replay_stub() -> None:
    assert "cases" in replay_case_stub()


def test_confidence_engine() -> None:
    r = ruling_confidence_engine({"official_source": True, "citations": 2})
    assert r["score"] > 0.8


def test_investigation() -> None:
    assert parse_investigation_stub({"event_id": "e1"})["event_id"] == "e1"


def test_paradox_hint() -> None:
    assert "assistant_guidance" in paradox_hint_stub("x")
