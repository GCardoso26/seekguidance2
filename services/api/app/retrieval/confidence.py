"""Score de confiança a partir de sinais de retrieval (sem valores inventados)."""

from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID


@dataclass(frozen=True)
class ConfidenceSignals:
    mean_fused: float
    mean_rerank: float | None
    top1_rerank: float | None
    vec_lex_overlap: float  # |intersection| / |union| dos top-k brutos
    score_spread: float  # (top1 - mean) / max(top1, eps)
    n_sources: int
    n_chunks: int
    n_expansion_parents: int


def _clamp01(x: float) -> float:
    return max(0.0, min(1.0, x))


def compute_confidence(sig: ConfidenceSignals) -> float:
    """
    Combinação interpretável (0-1):
    - acordo entre ramos (overlap vetorial vs lexical)
    - força média do score fusionado / rerank
    - dispersão (spread alto em rerank => mais confiança relativa no top1)
    - diversidade de fonte (documentos distintos)
    """
    w_overlap = 0.28
    w_fused = 0.22
    w_rerank = 0.26
    w_spread = 0.12
    w_sources = 0.12

    overlap = _clamp01(sig.vec_lex_overlap)
    fused = _clamp01(sig.mean_fused * 1.15)

    if sig.mean_rerank is not None and sig.top1_rerank is not None:
        rr_mean = _clamp01(sig.mean_rerank)
        rr_top = _clamp01(sig.top1_rerank)
        rerank_term = 0.55 * rr_top + 0.45 * rr_mean
        spread = _clamp01(sig.score_spread)
    else:
        rerank_term = fused
        spread = _clamp01(sig.score_spread)

    # Poucos documentos distintos reduzem confiança auditável
    src = _clamp01(min(1.0, sig.n_sources / 3.0))
    # Penalizar se quase tudo veio só de expansão sem hits fortes
    anchor = _clamp01(min(1.0, (sig.n_chunks - sig.n_expansion_parents + 1) / max(sig.n_chunks, 1)))

    raw = w_overlap * overlap + w_fused * fused + w_rerank * rerank_term + w_spread * spread + w_sources * src
    raw *= anchor
    return _clamp01(raw)


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
    """Pequeno bónus se várias citações cobrem mais de um documento."""
    if n_citations <= 0:
        return 0.0
    return 0.04 * _clamp01(min(1.0, n_unique_docs / max(n_citations, 1)))
