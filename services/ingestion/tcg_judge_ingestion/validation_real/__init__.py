"""validation_real package."""

from tcg_judge_ingestion.validation_real.archive_integrity import archive_integrity
from tcg_judge_ingestion.validation_real.citation_verification import citation_verification
from tcg_judge_ingestion.validation_real.corrupted_snapshot_detection import corrupted_snapshot_detection
from tcg_judge_ingestion.validation_real.detections import (
    broken_citation_stub,
    corpus_completeness_estimate,
    duplicate_semantic_cluster_stub,
    invalid_ontology_mapping_stub,
    missing_rules_hint,
)
from tcg_judge_ingestion.validation_real.duplicate_ruling_detection import duplicate_ruling_detection
from tcg_judge_ingestion.validation_real.metrics import orphan_lineage_score, parser_confidence_stub, semantic_coverage_ratio
from tcg_judge_ingestion.validation_real.ruling_conflict_detection import ruling_conflict_detection
from tcg_judge_ingestion.validation_real.semantic_completeness import semantic_completeness
from tcg_judge_ingestion.validation_real.temporal_inconsistency_detection import temporal_inconsistency_detection

__all__ = [
    "archive_integrity",
    "broken_citation_stub",
    "citation_verification",
    "corpus_completeness_estimate",
    "corrupted_snapshot_detection",
    "duplicate_ruling_detection",
    "duplicate_semantic_cluster_stub",
    "invalid_ontology_mapping_stub",
    "missing_rules_hint",
    "orphan_lineage_score",
    "parser_confidence_stub",
    "ruling_conflict_detection",
    "semantic_completeness",
    "semantic_coverage_ratio",
    "temporal_inconsistency_detection",
]
