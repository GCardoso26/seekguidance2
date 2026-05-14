"""Limites adaptativos para expansão de grafo (performance + relevância)."""

from __future__ import annotations

from app.core.config import Settings


def compute_graph_expansion_limit(
    settings: Settings,
    *,
    query_complexity: float,
    classifier_confidence: float,
    token_budget_available: int | None,
    intent_label: str,
    graph_expansion_scale: float = 1.0,
    retrieval_quality_ema: float | None = None,
) -> int:
    """
    Queries simples → grafo raso; complexas → mais vizinhos (com teto).
    Baixa confiança do classificador → reduz expansão para controlar ruído.
    """
    base = float(settings.graph_retrieval_extra_limit)
    mult = 1.0 * max(0.72, min(1.35, float(graph_expansion_scale)))
    qc = max(0.0, min(1.0, query_complexity))
    if qc < 0.38:
        mult *= 0.72
    elif qc > 0.72:
        mult *= 1.12

    cc = max(0.0, min(1.0, classifier_confidence))
    if cc < settings.confidence_low_threshold:
        mult *= 0.78
    # Ambiguidade: complexa mas classificador incerto → ligeiro boost cauteloso
    if qc > 0.62 and cc < 0.52:
        mult *= 1.04

    if token_budget_available is not None and token_budget_available < 2800:
        mult *= 0.82

    # Intents muito amplos: conter fan-out
    if intent_label in ("unknown", "gameplay_rules"):
        mult *= 0.9

    if retrieval_quality_ema is not None and retrieval_quality_ema < 0.48:
        mult *= 0.88

    raw = int(base * mult)
    return max(settings.graph_expansion_min, min(settings.graph_expansion_max, raw))


def dedupe_cap_heads(heads: list[str], *, max_heads: int) -> list[str]:
    """Remove duplicados preservando ordem e aplica teto de fan-out."""
    if max_heads <= 0:
        return []
    out: list[str] = []
    seen: set[str] = set()
    for h in heads:
        h = str(h).strip()
        if not h.isdigit() or h in seen:
            continue
        seen.add(h)
        out.append(h)
        if len(out) >= max_heads:
            break
    return out
