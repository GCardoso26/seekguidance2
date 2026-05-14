"""Lineage de documentos no corpus (derivado de ingestão)."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class CorpusLineageEdge:
    parent_chunk_id: str
    child_chunk_id: str
    relation: str


@dataclass
class CorpusLineageGraph:
    edges: list[CorpusLineageEdge] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)
