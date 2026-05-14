"""Drift de corpus (ingestão)."""

from tcg_judge_ingestion.drift.corpus_time_drift import ontology_drift_stub, replay_drift_stub, semantic_drift_score

__all__ = ["ontology_drift_stub", "replay_drift_stub", "semantic_drift_score"]
