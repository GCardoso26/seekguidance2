"""Chunking para PDFs de regras (MTG-style + janelas por parágrafo)."""

from __future__ import annotations

import hashlib
import re

from tcg_judge_ingestion.chunker.hierarchical_mtg import HierarchicalChunk, chunk_mtg_hierarchical

_MAX_CHUNK_CHARS = 2_400


def chunk_generic_hierarchical(raw_text: str, *, document_title: str) -> list[HierarchicalChunk]:
    structured = chunk_mtg_hierarchical(raw_text, document_title=document_title)
    if len(structured) > 1:
        return structured
    if len(structured) == 1 and not structured[0].metadata.get("fallback"):
        return structured

    text = raw_text.strip()
    if not text:
        return structured

    paragraphs = re.split(r"\n\s*\n+", text)
    chunks: list[HierarchicalChunk] = []
    buf: list[str] = []
    buf_len = 0
    idx = 0

    def flush_buf() -> None:
        nonlocal idx, buf, buf_len
        if not buf:
            return
        block = "\n\n".join(buf).strip()
        buf = []
        buf_len = 0
        if not block:
            return
        chunks.append(
            HierarchicalChunk(
                chunk_index=idx,
                rule_path=None,
                parent_rule_path=None,
                hierarchy_level=0,
                title=document_title,
                semantic_path=document_title,
                text=block[:120_000],
                token_count=max(1, len(block) // 4),
                content_sha256=hashlib.sha256(block.encode("utf-8")).hexdigest(),
                metadata={"document_title": document_title, "windowed": True},
            )
        )
        idx += 1

    for para in paragraphs:
        p = para.strip()
        if not p:
            continue
        if buf_len + len(p) > _MAX_CHUNK_CHARS and buf:
            flush_buf()
        buf.append(p)
        buf_len += len(p)
    flush_buf()

    return chunks if chunks else structured
