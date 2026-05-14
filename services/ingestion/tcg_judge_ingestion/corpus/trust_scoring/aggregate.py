"""Agregação de scores de confiança do corpus."""

from __future__ import annotations

from tcg_judge_ingestion.trust.citation_strength import citation_strength
from tcg_judge_ingestion.trust.provenance_score import provenance_score
from tcg_judge_ingestion.trust.semantic_confidence import semantic_confidence
from tcg_judge_ingestion.trust.source_trust import source_trust_index


def aggregate_trust(*, publisher: str | None, citation_depth: int, semantic_hits: int) -> float:
    st = source_trust_index(publisher or "unknown")
    pr = provenance_score(has_checksum=True, tls_ok=True)
    sem = semantic_confidence(semantic_hits, baseline=3)
    cit = citation_strength(citation_depth)
    return round(min(1.0, 0.35 * st + 0.25 * pr + 0.25 * sem + 0.15 * cit), 4)
