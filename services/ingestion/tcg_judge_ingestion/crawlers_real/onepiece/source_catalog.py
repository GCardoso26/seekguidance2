"""Catálogo declarativo de fontes (URLs reais em produção)."""
from __future__ import annotations

from typing import Any

GAME_SLUG = "onepiece"


def catalog_entries() -> list[dict[str, Any]]:
    from tcg_judge_ingestion.crawler.tcg_official_sources import list_official_pdfs

    return [
        {
            "kind": p.doc_type.lower(),
            "game": GAME_SLUG,
            "priority": 1.0,
            "url": p.url,
            "title": p.title,
        }
        for p in list_official_pdfs(GAME_SLUG)
    ]
