"""Cliente genérico resiliente (delega em resilient_fetch)."""

from __future__ import annotations

import hashlib

from tcg_judge_ingestion.crawler.mtg_wizards import USER_AGENT
from tcg_judge_ingestion.crawler.publisher_clients.models import PublisherFetchMeta
from tcg_judge_ingestion.crawler.resilient_fetch import resilient_get_bytes


class GenericPublisherClient:
    """Base para crawlers por publisher; especializar headers se necessário."""

    async def fetch_document(self, url: str) -> tuple[bytes, str, PublisherFetchMeta]:
        data, mime, hdrs = await resilient_get_bytes(url, user_agent=USER_AGENT)
        sha = hashlib.sha256(data).hexdigest()
        meta = PublisherFetchMeta(
            url=url,
            etag=hdrs.get("etag"),
            last_modified=hdrs.get("last-modified"),
            content_sha256=sha,
        )
        return data, mime, meta
