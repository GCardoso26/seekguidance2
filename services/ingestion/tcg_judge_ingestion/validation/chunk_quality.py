"""Validação de qualidade de chunk."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ChunkQualityScore:
    score: float
    reasons: tuple[str, ...]


def score_chunk(*, text: str, min_chars: int = 40) -> ChunkQualityScore:
    reasons: list[str] = []
    t = text.strip()
    if len(t) < min_chars:
        reasons.append("too_short")
    if not t:
        reasons.append("empty")
    score = 1.0 - 0.2 * len(reasons)
    return ChunkQualityScore(score=max(0.0, score), reasons=tuple(reasons))
