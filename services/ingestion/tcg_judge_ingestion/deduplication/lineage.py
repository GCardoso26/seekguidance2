"""Linhagem de chunks (reindex incremental, citações estáveis)."""

from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID


@dataclass(frozen=True)
class ChunkLineage:
    chunk_id: UUID
    document_id: UUID
    lineage_root_chunk_id: UUID | None
    semantic_fingerprint: str | None
