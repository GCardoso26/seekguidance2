"""Scoring temporal pós-fetch (coerência de snapshot + relevância histórica)."""

from __future__ import annotations

from datetime import date

from app.context.temporal import TemporalHint
from app.core.config import Settings
from app.retrieval.temporal_sql import parse_as_of_date
from app.retrieval.types import ChunkHit


def _parse_meta_date(val: object) -> date | None:
    if val is None:
        return None
    if isinstance(val, date):
        return val
    s = str(val).strip()[:10]
    return parse_as_of_date(s)


def compute_temporal_score(hit: ChunkHit, temporal: TemporalHint, settings: Settings) -> float:
    """
    Combina: match de janela, consistência (versão encerrada vs ativa), boost histórico.
    Saída tipicamente em [0, 1].
    """
    as_d = parse_as_of_date(temporal.as_of)
    vf = _parse_meta_date(hit.metadata.get("version_effective_from"))
    vt = _parse_meta_date(hit.metadata.get("version_effective_to"))

    match = 0.35
    if as_d and vf:
        if vf <= as_d and (vt is None or vt > as_d):
            match = 1.0
        elif vf <= as_d and vt is not None and vt <= as_d:
            match = 0.55
        else:
            match = 0.2

    snapshot = 0.45
    if vt is None:
        snapshot = 0.75 if not temporal.prefer_historical else 0.35
    else:
        snapshot = 0.85 if temporal.prefer_historical else 0.5

    hist_boost = settings.temporal_historical_boost if temporal.prefer_historical else 0.0
    raw = settings.temporal_weight_version_match * match + settings.temporal_weight_snapshot * snapshot + hist_boost
    return max(0.0, min(1.0, raw))


def composite_retrieval_score(hit: ChunkHit, settings: Settings) -> float:
    """Média ponderada híbrido + temporal + rerank (rerank ausente usa fused)."""
    rr = float(hit.rerank_score) if hit.rerank_score is not None else hit.fused_score
    w_h = settings.score_weight_hybrid
    w_t = settings.score_weight_temporal
    w_r = settings.score_weight_rerank
    denom = w_h + w_t + w_r
    if denom <= 0:
        return float(hit.fused_score)
    return (w_h * hit.fused_score + w_t * hit.temporal_score + w_r * rr) / denom
