"""Lineage de chunks (grafo derivado + referências cross-version)."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class ChunkLineageNode:
    chunk_id: str
    document_version: str | None
    semantic_hash: str | None
    cross_version_refs: list[str] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)
