"""Proveniência mínima por artefacto ingerido."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass
class ProvenanceRecord:
    source_uri: str | None
    publisher: str | None
    retrieved_at: str | None
    content_hash: str | None


def provenance_to_dict(rec: ProvenanceRecord) -> dict[str, Any]:
    return {
        "source_uri": rec.source_uri,
        "publisher": rec.publisher,
        "retrieved_at": rec.retrieved_at,
        "content_hash": rec.content_hash,
    }
