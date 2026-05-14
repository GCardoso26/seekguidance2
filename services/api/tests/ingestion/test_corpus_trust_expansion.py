"""Corpus expansion + trust (ingestão)."""

from __future__ import annotations

from tcg_judge_ingestion.corpus.expansion_engine import default_expansion_intents, expansion_plan_summary
from tcg_judge_ingestion.corpus.metrics_quality import corpus_quality_dashboard
from tcg_judge_ingestion.corpus.semantic_alignment.aligner import alignment_score
from tcg_judge_ingestion.corpus.trust_scoring.aggregate import aggregate_trust
from tcg_judge_ingestion.parsers.registry import extract_for_game


def test_default_expansion_intents() -> None:
    intents = default_expansion_intents()
    s = expansion_plan_summary(intents)
    assert s["count"] >= 10


def test_aggregate_trust() -> None:
    t = aggregate_trust(publisher="wizards", citation_depth=2, semantic_hits=4)
    assert t >= 0.35


def test_alignment_score() -> None:
    assert alignment_score("a b c", "b c d") > 0


def test_extract_enriched_ygo() -> None:
    out = extract_for_game("yugioh", "chain segoc")
    assert "structured_rule_draft_v5" in out
    assert out["structured_rule_draft_v5"]["game"] == "yugioh"


def test_corpus_quality_dashboard() -> None:
    d = corpus_quality_dashboard(chunks_by_game={"mtg": 100, "yugioh": 50}, last_ingest_ts={"mtg": "2026-01-01"})
    assert d["total_chunks"] == 150
