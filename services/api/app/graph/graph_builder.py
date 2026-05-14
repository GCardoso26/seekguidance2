"""Constrói conjuntos de cabeçalhos de regra a partir dos hits."""

from __future__ import annotations

from app.graph.semantic_links import neighbor_heads_for_paths
from app.retrieval.types import ChunkHit


def seed_rule_heads_from_hits(hits: list[ChunkHit], *, max_seeds: int = 8) -> list[str]:
    paths = [h.rule_path for h in hits[:max_seeds]]
    return neighbor_heads_for_paths(paths)
