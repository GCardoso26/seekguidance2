"""Fusão lexical + denso: pesos configuráveis e RRF opcional."""

from __future__ import annotations

from collections.abc import Iterable
from uuid import UUID


def rrf_merge(
    lists: list[list[UUID]],
    *,
    k: int = 60,
) -> dict[UUID, float]:
    scores: dict[UUID, float] = {}
    for lst in lists:
        for rank, cid in enumerate(lst):
            scores[cid] = scores.get(cid, 0.0) + 1.0 / (k + rank + 1)
    return scores


def _normalize_map(raw: dict[UUID, float], *, higher_is_better: bool) -> dict[UUID, float]:
    if not raw:
        return {}
    vals = list(raw.values())
    lo, hi = min(vals), max(vals)
    if hi <= lo:
        return {u: 1.0 for u in raw}
    out: dict[UUID, float] = {}
    for u, v in raw.items():
        n = (v - lo) / (hi - lo)
        if not higher_is_better:
            n = 1.0 - n
        out[u] = max(0.0, min(1.0, n))
    return out


def cosine_distance_to_similarity(dist: float) -> float:
    """`<=>` cosine distance em pgvector está tipicamente em [0, 2] para vetores L2-normalizados."""
    return max(0.0, min(1.0, 1.0 - float(dist) / 2.0))


def weighted_hybrid_scores(
    *,
    vector_scores: dict[UUID, float],
    lexical_scores: dict[UUID, float],
    vector_weight: float,
    lexical_weight: float,
) -> dict[UUID, float]:
    """
    Combina similaridade densa (0-1) com relevância lexical normalizada (0-1).
    Chunks só em um ramo recebem contribuição parcial normalizada pelo peso ativo.
    """
    v_w = max(0.0, float(vector_weight))
    l_w = max(0.0, float(lexical_weight))
    if v_w + l_w <= 0:
        return {}

    ids: set[UUID] = set(vector_scores) | set(lexical_scores)
    fused: dict[UUID, float] = {}
    for uid in ids:
        has_v = uid in vector_scores
        has_l = uid in lexical_scores
        denom = (v_w if has_v else 0.0) + (l_w if has_l else 0.0)
        if denom <= 0:
            continue
        fused[uid] = (v_w * vector_scores.get(uid, 0.0) + l_w * lexical_scores.get(uid, 0.0)) / denom
    return fused


def merge_rrf_and_weighted(
    *,
    vec_ids: list[UUID],
    lex_ids: list[UUID],
    vector_scores: dict[UUID, float],
    lexical_scores: dict[UUID, float],
    vector_weight: float,
    lexical_weight: float,
    rrf_blend: float,
) -> dict[UUID, float]:
    """
    `rrf_blend` em [0,1]: 0 = só ponderado; 1 = só RRF; valores intermédios misturam.
    """
    rrf = rrf_merge([vec_ids, lex_ids])
    wtd = weighted_hybrid_scores(
        vector_scores=vector_scores,
        lexical_scores=lexical_scores,
        vector_weight=vector_weight,
        lexical_weight=lexical_weight,
    )
    if not wtd and not rrf:
        return {}
    b = max(0.0, min(1.0, float(rrf_blend)))
    keys: Iterable[UUID] = set(rrf) | set(wtd)
    # normalizar RRF ao intervalo [0,1] para combinar com weighted
    rrf_vals = list(rrf.values()) if rrf else [0.0]
    r_lo, r_hi = min(rrf_vals), max(rrf_vals)
    out: dict[UUID, float] = {}
    for uid in keys:
        r_score = rrf.get(uid, 0.0)
        if r_hi > r_lo:
            r_norm = (r_score - r_lo) / (r_hi - r_lo)
        else:
            r_norm = 1.0 if r_score > 0 else 0.0
        w_score = wtd.get(uid, 0.0)
        out[uid] = (1.0 - b) * w_score + b * r_norm
    return out


def normalize_lexical_ranks(scores: dict[UUID, float]) -> dict[UUID, float]:
    """ts_rank_cd: maior = melhor."""
    return _normalize_map(scores, higher_is_better=True)
