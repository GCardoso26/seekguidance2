"""Validação de pipeline antes de persistir embeddings."""

from __future__ import annotations

from typing import Any

from tcg_judge_ingestion.validation.chunk_quality import score_chunk
from tcg_judge_ingestion.validation.citation_integrity import citation_integrity_ok


def validate_chunk_row(*, text: str, source_url: str, rule_path: str | None) -> dict[str, Any]:
    q = score_chunk(text=text)
    cit = citation_integrity_ok(source_url=source_url, rule_path=rule_path)
    return {
        "ok": q.score >= 0.6 and cit,
        "quality": {"score": q.score, "reasons": list(q.reasons)},
        "citation_ok": cit,
    }
