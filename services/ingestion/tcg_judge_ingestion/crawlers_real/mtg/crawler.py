"""Crawler publisher-grade — integra com `crawler.resilient_fetch`."""
from __future__ import annotations

from typing import Any

GAME_SLUG = 'mtg'


def crawl_intent(*, url: str, etag: str | None = None) -> dict[str, Any]:
    from tcg_judge_ingestion.crawlers_real.http_semantics import robots_txt_policy_stub

    pol = robots_txt_policy_stub("magic.wizards.com")
    return {"game": GAME_SLUG, "url": url, "etag": etag, "stage": "queued_stub", "robots_policy": pol}
