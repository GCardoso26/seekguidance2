"""validation_real detections."""

from __future__ import annotations

from tcg_judge_ingestion.validation_real import broken_citation_stub, missing_rules_hint


def test_missing_rules() -> None:
    out = missing_rules_hint({"502", "704"}, {"502"})
    assert out["missing_count"] == 1


def test_broken_citation() -> None:
    out = broken_citation_stub("https://evil.example/x", {"example.com"})
    assert out["broken"] is True
