"""Diversificação por hierarquia / documento para evitar redundância intra-subseção."""

from __future__ import annotations

import re
from uuid import UUID

from app.retrieval.types import ChunkHit

_RULE_HEAD = re.compile(r"^(\d+)")


def rule_chapter(rule_path: str | None) -> str | None:
    if not rule_path:
        return None
    m = _RULE_HEAD.match(rule_path.strip())
    return m.group(1) if m else None


def diversify_hits(
    hits: list[ChunkHit],
    *,
    max_total: int,
    max_per_chapter: int,
    max_per_document: int,
) -> list[ChunkHit]:
    """
    Seleção greedy por `fused_score` com quotas por capítulo (ex.: 603) e por documento.
    """
    ordered = sorted(hits, key=lambda h: -h.fused_score)
    chapter_counts: dict[str, int] = {}
    doc_counts: dict[UUID, int] = {}
    out: list[ChunkHit] = []
    seen_ids: set[UUID] = set()

    for h in ordered:
        if len(out) >= max_total:
            break
        chap = rule_chapter(h.rule_path) or "__none__"
        did = h.document_id
        if chapter_counts.get(chap, 0) >= max_per_chapter:
            continue
        if doc_counts.get(did, 0) >= max_per_document:
            continue
        out.append(h)
        seen_ids.add(h.chunk_id)
        chapter_counts[chap] = chapter_counts.get(chap, 0) + 1
        doc_counts[did] = doc_counts.get(did, 0) + 1

    # preencher slots restantes mantendo quota por capítulo
    if len(out) < max_total:
        for h in ordered:
            if len(out) >= max_total:
                break
            if h.chunk_id in seen_ids:
                continue
            chap = rule_chapter(h.rule_path) or "__none__"
            did = h.document_id
            if chapter_counts.get(chap, 0) >= max_per_chapter:
                continue
            if doc_counts.get(did, 0) >= max_per_document + 2:
                continue
            out.append(h)
            seen_ids.add(h.chunk_id)
            chapter_counts[chap] = chapter_counts.get(chap, 0) + 1
            doc_counts[did] = doc_counts.get(did, 0) + 1

    out.sort(key=lambda h: -h.fused_score)
    return out[:max_total]
