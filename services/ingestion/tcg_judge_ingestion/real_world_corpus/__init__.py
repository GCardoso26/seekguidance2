"""Corpus mundo real (lineage, supersession, drift)."""

from tcg_judge_ingestion.real_world_corpus.conflict_lineage import conflict_aware_lineage_stub
from tcg_judge_ingestion.real_world_corpus.historical_drift import historical_legality_drift_stub
from tcg_judge_ingestion.real_world_corpus.replay_snapshots import replayable_snapshot_stub
from tcg_judge_ingestion.real_world_corpus.semantic_reconstruction import semantic_archive_reconstruction_stub

__all__ = [
    "conflict_aware_lineage_stub",
    "historical_legality_drift_stub",
    "replayable_snapshot_stub",
    "semantic_archive_reconstruction_stub",
]
