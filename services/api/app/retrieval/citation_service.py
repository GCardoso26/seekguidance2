"""Montagem de citações auditáveis a partir de chunks recuperados."""

from __future__ import annotations

from typing import Any

from app.retrieval.types import ChunkHit
from app.schemas.chat import ChatCitation


def _page_from_metadata(meta: dict[str, Any]) -> int | None:
    page = meta.get("page_number")
    if isinstance(page, int):
        return page
    if isinstance(page, str):
        if page.isdigit():
            return int(page)
        try:
            return int(float(page))
        except ValueError:
            return None
    return None


def citations_from_hits(hits: list[ChunkHit]) -> list[ChatCitation]:
    out: list[ChatCitation] = []
    for h in hits:
        meta = h.metadata or {}
        page_int = _page_from_metadata(meta)
        score = h.effective_score
        out.append(
            ChatCitation(
                document_title=h.document_title,
                source_url=h.source_url,
                section_path=h.rule_path or h.semantic_path,
                rule_path=h.rule_path,
                version_label=h.version_label,
                excerpt=_excerpt(h.text),
                document_hash=h.document_content_hash,
                chunk_content_sha256=h.content_sha256,
                retrieval_score=round(float(score), 6),
                page_number=page_int,
            )
        )
    return out


def _excerpt(text: str, max_len: int = 420) -> str:
    t = " ".join(text.split())
    return t if len(t) <= max_len else t[: max_len - 1] + "…"
