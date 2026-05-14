"""Envelopes hierárquicos — texto derivado sem paráfrase LLM."""

from __future__ import annotations

from app.context.compressor import compress_preserving_legal_semantics
from app.retrieval.types import ChunkHit


def envelope_parent(h: ChunkHit, max_chars: int) -> str:
    path = h.rule_path or h.semantic_path or "?"
    doc = h.metadata.get("doc_type") or "doc"
    head = f"[PARENT CONTEXT | {doc.upper()} | {path}]"
    body = compress_preserving_legal_semantics(h.text, max(200, max_chars - len(head) - 2))
    return f"{head}\n{body}"


def envelope_atomic(h: ChunkHit, max_chars: int) -> str:
    path = h.rule_path or h.semantic_path or "atomic"
    head = f"[ATOMIC RULE | {path} | score={h.effective_score:.4f}]"
    body = compress_preserving_legal_semantics(h.text, max(240, max_chars - len(head) - 2))
    return f"{head}\n{body}"


def envelope_sibling(h: ChunkHit, max_chars: int) -> str:
    path = h.rule_path or h.semantic_path or "related"
    head = f"[SIBLING / RELATED | {path}]"
    body = compress_preserving_legal_semantics(h.text, max(180, max_chars - len(head) - 2))
    return f"{head}\n{body}"
