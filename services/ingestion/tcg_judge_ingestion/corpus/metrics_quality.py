"""Métricas de qualidade / cobertura do corpus (sem dependência de DB)."""

from __future__ import annotations

from typing import Any


def corpus_quality_dashboard(
    *,
    chunks_by_game: dict[str, int],
    last_ingest_ts: dict[str, str | None],
) -> dict[str, Any]:
    total = sum(chunks_by_game.values())
    return {
        "total_chunks": total,
        "tcg_coverage": {g: c / max(1, total) for g, c in chunks_by_game.items()},
        "ingestion_freshness": last_ingest_ts,
        "semantic_coverage_stub": round(min(1.0, total / 5000), 3),
    }
