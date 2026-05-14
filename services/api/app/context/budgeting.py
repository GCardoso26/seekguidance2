"""Orçamento de tokens (tiktoken) com prioridade hierárquica."""

from __future__ import annotations

from dataclasses import dataclass

import tiktoken

from app.retrieval.types import ChunkHit


@dataclass(frozen=True)
class TokenBudget:
    total: int
    reserved_answer: int
    available_for_context: int


def estimate_tokens(text: str, *, model_encoding: str = "cl100k_base") -> int:
    try:
        enc = tiktoken.get_encoding(model_encoding)
    except KeyError:
        enc = tiktoken.get_encoding("cl100k_base")
    return len(enc.encode(text))


def build_budget(total: int, *, reserved_answer: int = 900) -> TokenBudget:
    avail = max(512, total - reserved_answer)
    return TokenBudget(total=total, reserved_answer=reserved_answer, available_for_context=avail)


def hierarchy_priority(h: ChunkHit) -> float:
    """Maior = manter mais texto em compressão."""
    base = h.effective_score
    if h.expansion_source == "atomic":
        base += 0.25
    if h.rule_path and "." in h.rule_path:
        base += 0.05 * min(5, h.rule_path.count("."))
    if any(k in h.text.lower() for k in ("exception", "note:", "example", "instead")):
        base += 0.12
    return base
