"""Score de confiança a partir de sinais de retrieval (sem valores inventados)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING
from uuid import UUID

from app.retrieval.confidence_profiles import ConfidenceProfile, get_confidence_profile

if TYPE_CHECKING:
    from app.retrieval.types import ChunkHit


@dataclass(frozen=True)
class ConfidenceSignals:
    mean_fused: float
    top1_fused: float
    mean_rerank: float | None
    top1_rerank: float | None
    vec_lex_overlap: float
    score_spread: float
    n_sources: int
    n_rule_sources: int
    n_chunks: int
    n_expansion_parents: int


def _clamp01(x: float) -> float:
    return max(0.0, min(1.0, x))


def count_distinct_rule_sources(hits: list[ChunkHit]) -> int:
    """Fontes distintas por rule_path; fallback para document_id."""
    paths: set[str] = set()
    for h in hits:
        rp = (h.rule_path or "").strip()
        if not rp and h.metadata:
            rp = str(h.metadata.get("rule_path") or "").strip()
        if rp:
            paths.add(rp)
    if paths:
        return len(paths)
    return len({h.document_id for h in hits})


def compute_confidence(
    sig: ConfidenceSignals,
    profile: ConfidenceProfile | None = None,
) -> float:
    p = profile or get_confidence_profile(None)

    overlap = _clamp01(sig.vec_lex_overlap)
    mean_f = _clamp01(sig.mean_fused * p.fused_scale)
    top1_f = _clamp01(sig.top1_fused * p.fused_scale)

    if sig.mean_rerank is not None and sig.top1_rerank is not None:
        rr_mean = _clamp01(sig.mean_rerank)
        rr_top = _clamp01(sig.top1_rerank)
        rerank_term = 0.55 * rr_top + 0.45 * rr_mean
        spread = _clamp01(sig.score_spread)
    else:
        rerank_term = 0.55 * top1_f + 0.45 * mean_f
        spread = _clamp01(sig.score_spread)

    n_src = sig.n_rule_sources if p.use_rule_path_sources else sig.n_sources
    src = _clamp01(min(1.0, n_src / max(1.0, p.source_divisor)))

    anchor = _clamp01(min(1.0, (sig.n_chunks - sig.n_expansion_parents + 1) / max(sig.n_chunks, 1)))
    if sig.top1_fused >= 0.45:
        anchor = max(anchor, p.anchor_floor)

    raw = (
        p.w_overlap * overlap
        + p.w_fused * mean_f
        + p.w_top1 * top1_f
        + p.w_rerank * rerank_term
        + p.w_spread * spread
        + p.w_sources * src
    )
    return _clamp01(raw * anchor)


def score_spread_from_list(scores: list[float]) -> float:
    if not scores:
        return 0.0
    top = max(scores)
    if top <= 1e-9:
        return 0.0
    mean = sum(scores) / len(scores)
    return _clamp01((top - mean) / top)


def vec_lex_agreement(vec_top: list[UUID], lex_top: list[UUID], *, k: int = 8) -> float:
    a = set(vec_top[:k])
    b = set(lex_top[:k])
    if not a and not b:
        return 0.0
    inter = len(a & b)
    uni = len(a | b)
    return inter / uni if uni else 0.0


def citation_consistency_bonus(n_citations: int, n_unique_docs: int) -> float:
    if n_citations <= 0:
        return 0.0
    return 0.04 * _clamp01(min(1.0, n_unique_docs / max(n_citations, 1)))
