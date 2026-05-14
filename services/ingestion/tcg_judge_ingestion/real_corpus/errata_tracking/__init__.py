"""Errata: evolução semântica e impacto em comportamento de mesa."""

from tcg_judge_ingestion.real_corpus.errata_tracking.errata_evolution import errata_version_chain
from tcg_judge_ingestion.real_corpus.errata_tracking.runtime_behavior_delta import behavior_delta_stub
from tcg_judge_ingestion.real_corpus.errata_tracking.semantic_errata_diff import semantic_errata_stub

__all__ = ["behavior_delta_stub", "errata_version_chain", "semantic_errata_stub"]
