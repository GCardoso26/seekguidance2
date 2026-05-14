"""Corpus executável real (ingestão)."""

from __future__ import annotations

from tcg_judge_ingestion.cross_tcg_case_archives import cross_tcg_case_archive_stub
from tcg_judge_ingestion.real_execution_corpus import real_execution_bundle_stub
from tcg_judge_ingestion.replacement_loop_corpus import replacement_loop_corpus_stub


def test_real_execution_bundle() -> None:
    b = real_execution_bundle_stub("r1")
    assert b["replay_confidence"] > 0


def test_replacement_loop_corpus() -> None:
    assert replacement_loop_corpus_stub(8)["max_observed_depth"] == 8


def test_cross_tcg_archive() -> None:
    assert "games" in cross_tcg_case_archive_stub(["mtg", "fab"])
