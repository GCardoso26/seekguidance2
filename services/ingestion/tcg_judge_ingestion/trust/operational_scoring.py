"""Trust operacional (oficial vs arquivo / rulings)."""

from __future__ import annotations

from tcg_judge_ingestion.trust.source_trust import source_trust_index


def ruling_reliability_stub(is_official: bool, citation_depth: int) -> float:
    base = 0.85 if is_official else 0.45
    return min(1.0, base + 0.03 * min(citation_depth, 5))


def archive_confidence_stub(publisher: str, tls_ok: bool, checksum_ok: bool) -> float:
    st = source_trust_index(publisher)
    bonus = 0.1 if tls_ok else 0.0
    bonus += 0.05 if checksum_ok else 0.0
    return round(min(1.0, 0.5 * st + 0.5 * (0.4 + bonus)), 4)
