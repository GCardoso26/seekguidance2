"""Persistência temporal / lineage de corpus (modelos imutáveis em ingestão)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class CorpusTemporalEdge:
    """Ligação entre revisões de documento (effective dates + supersedência)."""

    document_id: str
    effective_from: str | None
    effective_to: str | None
    supersedes: str | None
    superseded_by: str | None
    semantic_hash: str | None
    ontology_lineage_id: str | None


def edge_to_dict(edge: CorpusTemporalEdge) -> dict[str, Any]:
    return {
        "document_id": edge.document_id,
        "effective_from": edge.effective_from,
        "effective_to": edge.effective_to,
        "supersedes": edge.supersedes,
        "superseded_by": edge.superseded_by,
        "semantic_hash": edge.semantic_hash,
        "ontology_lineage_id": edge.ontology_lineage_id,
    }
