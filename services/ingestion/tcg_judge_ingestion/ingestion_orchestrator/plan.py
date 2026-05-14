"""Orquestração declarativa de pipelines de ingestão."""

from __future__ import annotations

from typing import Any

from tcg_judge_ingestion.crawler.sources_registry import sources_for_game


def build_ingestion_plan(game_slug: str) -> list[dict[str, Any]]:
    return [{"url": s.url, "doc_type": s.doc_type, "title": s.title} for s in sources_for_game(game_slug)]
