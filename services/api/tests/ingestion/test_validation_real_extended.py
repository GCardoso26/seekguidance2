"""validation_real expandido."""

from __future__ import annotations

from tcg_judge_ingestion.validation_real import (
    archive_integrity,
    citation_verification,
    corrupted_snapshot_detection,
    duplicate_ruling_detection,
    ruling_conflict_detection,
    semantic_completeness,
    temporal_inconsistency_detection,
)


def test_ruling_conflict() -> None:
    c = ruling_conflict_detection(
        [{"id": "1", "conclusion": "a"}, {"id": "1", "conclusion": "b"}],
    )
    assert "1" in c


def test_archive() -> None:
    assert archive_integrity("a", "a")["ok"] is True


def test_citation() -> None:
    assert citation_verification(["x"])["ok"] is True


def test_semantic_completeness() -> None:
    assert semantic_completeness({"a", "b"}, {"a"}) == 0.5


def test_duplicate_ruling() -> None:
    assert duplicate_ruling_detection(["a", "a"])["duplicates"] is True


def test_corrupted() -> None:
    assert corrupted_snapshot_detection(True, False)["corrupted"] is True


def test_temporal() -> None:
    assert temporal_inconsistency_detection(["2025-02", "2025-01"])["ok"] is False
