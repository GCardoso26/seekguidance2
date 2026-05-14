"""Ingestão + corpus lineage."""

from __future__ import annotations

from tcg_judge_ingestion.corpus_lineage import temporal_provenance_bundle
from tcg_judge_ingestion.ingestion_maturity import archival_fingerprint, replayable_ingestion_history
from tcg_judge_ingestion.ingestion_runtime import adaptive_fetch_delay, ingestion_backpressure_level


def test_provenance() -> None:
    p = temporal_provenance_bundle(doc_id="d1", ingested_at="2025-01", effective_at=None)
    assert p["doc_id"] == "d1"


def test_ingestion_backpressure() -> None:
    assert ingestion_backpressure_level(100, soft=50, hard=200) == "soft"


def test_adaptive_fetch() -> None:
    assert adaptive_fetch_delay(2) >= 0.5


def test_fingerprint() -> None:
    assert len(archival_fingerprint(b"x")) == 16


def test_replayable_history() -> None:
    h = replayable_ingestion_history(["fetch", "parse"])
    assert h["deterministic"] is True
