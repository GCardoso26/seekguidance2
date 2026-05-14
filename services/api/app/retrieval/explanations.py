"""Razões legíveis para debugging / confiança do retrieval (gameplay, não jurídico)."""

from __future__ import annotations

from app.query_understanding.decomposition import QueryDecomposition
from app.retrieval.types import ChunkHit


def build_retrieval_explanations(
    question: str,
    hits: list[ChunkHit],
    *,
    confidence: float,
    decomposition: QueryDecomposition | None,
    graph_expansion_n: int,
    temporal_score_mean: float,
    routing_profile: str | None = None,
    reasoning_graph_template: str | None = None,
) -> list[str]:
    reasons: list[str] = []
    qlow = (question or "").lower()

    if routing_profile:
        reasons.append(f"Routing profile: {routing_profile} (strategy tuned for this query shape).")
    if reasoning_graph_template:
        reasons.append(f"Reasoning graph template: {reasoning_graph_template}.")

    if decomposition and len(decomposition.sub_queries) > 1:
        reasons.append(f"Query decomposed into {len(decomposition.sub_queries)} retrieval facets for broader coverage.")
    if decomposition and decomposition.graph_seeds:
        reasons.append("Graph seeds include rule headings: " + ", ".join(decomposition.graph_seeds[:6]) + ".")

    if ("trigger" in qlow or "priority" in qlow) and any("603" in (h.rule_path or "") for h in hits[:8]):
        reasons.append("Matched timing semantics around triggered abilities (603.x passages present).")

    if "replacement" in qlow or "sba" in qlow or "state-based" in qlow:
        if graph_expansion_n > 0:
            reasons.append(
                "Expanded through gameplay interaction graph (replacement effects ↔ SBAs / cleanup context)."
            )
        if any("704" in (h.rule_path or "") or "614" in (h.rule_path or "") for h in hits[:10]):
            reasons.append("Strong lexical overlap with CR sections 614.x / 704.x in retrieved chunks.")

    if temporal_score_mean >= 0.62:
        reasons.append("High temporal relevance vs requested snapshot / historical mode.")
    elif temporal_score_mean <= 0.35 and temporal_score_mean > 0:
        reasons.append("Temporal signals mixed; verify version metadata if asking about older rules.")

    if confidence >= 0.55:
        reasons.append("Retrieval confidence is within the expected band for judge-grade answers.")
    else:
        reasons.append("Low aggregate retrieval confidence; answers should hedge and cite explicitly.")

    if not reasons:
        reasons.append("Standard hybrid vector + lexical retrieval with hierarchical context expansion.")

    return reasons[:12]


def build_explainability_v2(
    *,
    base_reasons: list[str],
    reasoning_path: list[str],
    graph_confidence: float,
) -> dict[str, object]:
    """Payload estável para API / logs (explainability v2)."""
    return {
        "retrieval_reason": base_reasons,
        "reasoning_path": reasoning_path,
        "graph_confidence": round(float(graph_confidence), 4),
    }
