"""Motor de inferência: combina sinais num score único e sugere tipo de relação."""

from __future__ import annotations

from dataclasses import asdict, dataclass

from app.graph.relationship_extraction.schema import InferredRuleEdge


@dataclass
class EdgeSignals:
    semantic_similarity: float
    citation_overlap: float
    cooccurrence_score: float
    lexical_match: float
    llm_confidence: float


def combine_relationship_score(s: EdgeSignals) -> float:
    """
    relationship_score =
        semantic*0.35 + citation*0.25 + cooccurrence*0.20 + lexical*0.10 + llm*0.10
    """
    return max(
        0.0,
        min(
            1.0,
            0.35 * s.semantic_similarity
            + 0.25 * s.citation_overlap
            + 0.20 * s.cooccurrence_score
            + 0.10 * s.lexical_match
            + 0.10 * s.llm_confidence,
        ),
    )


def infer_relationship_type(src: str, dst: str, *, context_blob: str) -> str:
    """
    Heurística leve por cabeçalhos + palavras-chave de gameplay (não é classificador jurídico).
    """
    blob = (context_blob or "").lower()
    pair = {src, dst}

    if pair >= {"614", "704"} or ("replacement" in blob and "state" in blob and "action" in blob):
        return "replacement_interaction"
    if pair >= {"704", "514"} or ("cleanup" in blob and "state" in blob):
        return "state_based_dependency"
    if pair >= {"117", "603"} or ("priority" in blob and "trigger" in blob):
        return "timing_related"
    if pair >= {"405", "117"} or "stack" in blob:
        return "stack_interaction"
    if pair >= {"613", "614"} or "layer" in blob:
        return "modifies"
    if "depend" in blob or "only if" in blob:
        return "depends_on"
    if "override" in blob or "instead" in blob:
        return "overrides"
    if "interact" in blob or "when" in blob:
        return "interacts_with"
    return "gameplay_dependency"


def build_inferred_edge(
    src: str,
    dst: str,
    signals: EdgeSignals,
    *,
    context_blob: str,
    evidence_tags: list[str],
) -> InferredRuleEdge:
    score = combine_relationship_score(signals)
    rel = infer_relationship_type(src, dst, context_blob=context_blob)
    ev = list(dict.fromkeys([*evidence_tags]))
    if score >= 0.55:
        ev.append("composite_score_gate")
    return InferredRuleEdge(
        source_rule_id=src,
        target_rule_id=dst,
        relationship_type=rel,
        confidence=max(signals.semantic_similarity, signals.llm_confidence, score),
        evidence=ev,
        relationship_score=score,
        metadata={"signal_breakdown": asdict(signals)},
    )
