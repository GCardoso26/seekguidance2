"""Rulings históricos: lineage temporal, confiança, diff cross-version."""

from tcg_judge_ingestion.real_corpus.historical_rulings.cross_version_ruling_diff import ruling_text_diff_stub
from tcg_judge_ingestion.real_corpus.historical_rulings.ruling_confidence_engine import ruling_confidence_engine
from tcg_judge_ingestion.real_corpus.historical_rulings.ruling_lineage import ruling_lineage_edges
from tcg_judge_ingestion.real_corpus.historical_rulings.ruling_temporal_alignment import align_ruling_timestamps

__all__ = [
    "align_ruling_timestamps",
    "ruling_confidence_engine",
    "ruling_lineage_edges",
    "ruling_text_diff_stub",
]
