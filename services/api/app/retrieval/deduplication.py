"""Deduplicação semântica por similaridade de cosseno (embeddings já indexados)."""

from __future__ import annotations

import math
from uuid import UUID

from app.retrieval.types import ChunkHit


def _cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b, strict=True))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    if na <= 0 or nb <= 0:
        return 0.0
    return max(-1.0, min(1.0, dot / (na * nb)))


def deduplicate_by_embedding(
    hits: list[ChunkHit],
    embeddings: dict[UUID, list[float]],
    *,
    threshold: float,
) -> list[ChunkHit]:
    """
    Greedy: mantém ordem de entrada (já por score); remove posteriores muito
    similares a qualquer chunk já aceite.
    """
    kept: list[ChunkHit] = []
    kept_embs: list[list[float]] = []
    thr = max(0.5, min(0.999, float(threshold)))

    for h in hits:
        emb = embeddings.get(h.chunk_id)
        if emb is None:
            kept.append(h)
            continue
        dup = False
        for ke in kept_embs:
            if _cosine(emb, ke) >= thr:
                dup = True
                break
        if dup:
            continue
        kept.append(h)
        kept_embs.append(emb)

    return kept
