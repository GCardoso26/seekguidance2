"""Corpus real massivo (rulings, torneios, errata, edge cases) — incremental."""

from tcg_judge_ingestion.real_corpus.edge_case_corpus import edge_case_catalog_stub
from tcg_judge_ingestion.real_corpus.historical_rulings.ruling_lineage import ruling_lineage_edges
from tcg_judge_ingestion.real_corpus.replay_case_library import replay_case_stub

__all__ = ["edge_case_catalog_stub", "replay_case_stub", "ruling_lineage_edges"]
