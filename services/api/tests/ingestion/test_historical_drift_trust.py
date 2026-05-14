"""Ingestão: arquivos, drift, trust operacional."""

from __future__ import annotations

from tcg_judge_ingestion.drift import ontology_drift_stub
from tcg_judge_ingestion.historical_archives import archive_intents_for_game
from tcg_judge_ingestion.trust.operational_scoring import archive_confidence_stub


def test_archive_intents_ygo() -> None:
    intents = archive_intents_for_game("yugioh")
    assert any(i["kind"] == "historical_ruling" for i in intents)


def test_ontology_drift() -> None:
    assert ontology_drift_stub("v1", "v2")["drift"] is True


def test_archive_confidence() -> None:
    c = archive_confidence_stub("wizards", True, True)
    assert c > 0.5
