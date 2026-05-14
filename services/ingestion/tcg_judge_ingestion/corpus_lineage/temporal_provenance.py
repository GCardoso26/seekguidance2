"""Proveniência temporal de documentos ingeridos."""

from __future__ import annotations

from typing import Any


def temporal_provenance_bundle(*, doc_id: str, ingested_at: str, effective_at: str | None) -> dict[str, Any]:
    return {
        "doc_id": doc_id,
        "ingested_at": ingested_at,
        "effective_at": effective_at,
        "assistant_note": "Use datas oficiais da publisher para prioridade em mesa.",
    }
