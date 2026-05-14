"""Corpus quality (ingestion package)."""

from __future__ import annotations

from tcg_judge_ingestion.corpus_quality import (
    errata_alignment_score,
    policy_delta_stub,
    ruling_confidence,
    semantic_corpus_score,
    tournament_integrity_flags,
    validate_archive_record,
)


def test_ruling_confidence() -> None:
    c = ruling_confidence(official=True, parser_ok=True, citations=2)
    assert c > 0.8


def test_archive_validator() -> None:
    bad = validate_archive_record({})
    assert bad["ok"] is False


def test_tournament() -> None:
    f = tournament_integrity_flags({})
    assert "missing_event_id" in f["flags"]


def test_errata_and_policy() -> None:
    assert errata_alignment_score(True, True) > 0.9
    assert policy_delta_stub("a", "b")["changed"] is True


def test_semantic_corpus() -> None:
    assert semantic_corpus_score(0.8, 0.5) > 0.5
