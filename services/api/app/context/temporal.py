"""Retrieval temporal: ordenação por versão/criação quando o utilizador pede regras antigas."""

from __future__ import annotations

from dataclasses import dataclass

from app.retrieval.types import ChunkHit


@dataclass(frozen=True)
class TemporalHint:
    prefer_historical: bool
    as_of: str | None = None  # ISO date futuro: filtro explícito em SQL


def apply_temporal_ranking(hits: list[ChunkHit]) -> list[ChunkHit]:
    """
    Coloca candidatos mais antigos primeiro quando há múltiplas versões indexadas.
    Usa `version_label` e `metadata.chunk_created_at` se existirem.
    """
    if not hits:
        return hits

    def sort_key(h: ChunkHit) -> tuple[str, str, float]:
        vl = (h.version_label or "").lower()
        created = str(h.metadata.get("chunk_created_at") or "")
        return (vl, created, -h.effective_score)

    return sorted(hits, key=sort_key)
