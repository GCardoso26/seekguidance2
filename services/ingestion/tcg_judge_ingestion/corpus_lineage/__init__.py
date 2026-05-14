"""Linha temporal de proveniência e ancestry semântica (metadados de corpus)."""

from tcg_judge_ingestion.corpus_lineage.errata_propagation import errata_propagation_edges
from tcg_judge_ingestion.corpus_lineage.policy_replacement import policy_replacement_edges
from tcg_judge_ingestion.corpus_lineage.ruling_supersession import superseded_ruling_ids
from tcg_judge_ingestion.corpus_lineage.semantic_ancestry import semantic_ancestry_stub
from tcg_judge_ingestion.corpus_lineage.temporal_provenance import temporal_provenance_bundle

__all__ = [
    "errata_propagation_edges",
    "policy_replacement_edges",
    "semantic_ancestry_stub",
    "superseded_ruling_ids",
    "temporal_provenance_bundle",
]
