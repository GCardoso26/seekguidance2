"""Corpus executável — rulings com expectativas de legalidade/replay."""

from tcg_judge_ingestion.executable_corpus.historical_replay_structured import structured_replay_timeline
from tcg_judge_ingestion.executable_corpus.ruling_record import build_executable_ruling_record
from tcg_judge_ingestion.executable_corpus.semantic_replay_index import semantic_replay_index_stub
from tcg_judge_ingestion.executable_corpus.temporal_semantic_lineage import version_to_version_legality_diff

__all__ = [
    "build_executable_ruling_record",
    "semantic_replay_index_stub",
    "structured_replay_timeline",
    "version_to_version_legality_diff",
]
