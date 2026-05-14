"""Controlo de qualidade do corpus (rulings, errata, torneios)."""

from tcg_judge_ingestion.corpus_quality.errata_alignment import errata_alignment_score
from tcg_judge_ingestion.corpus_quality.historical_archive_validator import validate_archive_record
from tcg_judge_ingestion.corpus_quality.policy_delta_tracking import policy_delta_stub
from tcg_judge_ingestion.corpus_quality.ruling_confidence import ruling_confidence
from tcg_judge_ingestion.corpus_quality.semantic_corpus_scoring import semantic_corpus_score
from tcg_judge_ingestion.corpus_quality.tournament_report_integrity import tournament_integrity_flags

__all__ = [
    "errata_alignment_score",
    "policy_delta_stub",
    "ruling_confidence",
    "semantic_corpus_score",
    "tournament_integrity_flags",
    "validate_archive_record",
]
