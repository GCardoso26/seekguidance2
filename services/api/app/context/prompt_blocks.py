"""Blocos de prompt ligados a chunks/citações para traceabilidade e pruning por prioridade."""

from __future__ import annotations

from dataclasses import dataclass, field

from app.context.temporal import TemporalHint
from app.core.config import Settings
from app.retrieval.temporal_scoring import composite_retrieval_score
from app.retrieval.types import ChunkHit


@dataclass
class PromptBlock:
    """Um bloco de contexto montado para o LLM, rastreável até chunks de origem."""

    block_id: str
    section_kind: str  # parent | atomic | sibling
    text: str
    source_chunk_ids: list[str] = field(default_factory=list)
    citation_ids: list[str] = field(default_factory=list)
    hierarchy_origin: str | None = None
    temporal_origin: str | None = None
    importance_score: float = 0.0
    citation_display_index: int | None = None


def _temporal_origin_label(hit: ChunkHit, temporal: TemporalHint) -> str:
    parts: list[str] = []
    if temporal.as_of:
        parts.append(f"as_of={temporal.as_of}")
    if temporal.prefer_historical:
        parts.append("prefer_historical")
    vf = hit.metadata.get("version_effective_from")
    vt = hit.metadata.get("version_effective_to")
    if vf or vt:
        parts.append(f"version_window={vf}->{vt}")
    return ";".join(parts) if parts else "current_default"


def block_importance(
    hit: ChunkHit,
    *,
    question: str,
    temporal: TemporalHint,
    settings: Settings,
) -> float:
    """Prioridade para pruning: retrieval composto, camada hierárquica, profundidade, alinhamento lexical."""
    base = composite_retrieval_score(hit, settings)
    layer = {"atomic": 1.0, "parent": 0.9, "sibling": 0.72}.get(hit.expansion_source, 0.82)
    depth = 1.0 / (1.0 + 0.1 * max(0, int(hit.hierarchy_level)))
    q = (question or "").lower()
    blob = f"{hit.text} {hit.rule_path or ''} {hit.semantic_path or ''}".lower()
    overlap = sum(1 for tok in q.split() if len(tok) > 3 and tok in blob)
    align = min(1.25, 1.0 + 0.04 * overlap)
    if temporal.prefer_historical:
        align *= 1.02
    temporal_term = max(0.0, min(1.0, float(hit.temporal_score)))
    return max(0.0, base * layer * depth * align * (0.55 + 0.45 * temporal_term))


def assign_block_ids(blocks: list[PromptBlock]) -> None:
    for i, b in enumerate(blocks):
        if not b.block_id:
            b.block_id = f"ctx-{i+1:03d}-{b.section_kind}"
