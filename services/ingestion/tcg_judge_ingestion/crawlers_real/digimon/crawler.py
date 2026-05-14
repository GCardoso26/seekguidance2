"""Crawler publisher-grade — integra com `crawler.resilient_fetch`."""
from __future__ import annotations

from typing import Any

GAME_SLUG = 'digimon'


def crawl_intent(*, url: str, etag: str | None = None) -> dict[str, Any]:
    return {"game": GAME_SLUG, "url": url, "etag": etag, "stage": "queued_stub"}
