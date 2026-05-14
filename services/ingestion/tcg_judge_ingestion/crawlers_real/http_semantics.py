"""Semântica HTTP para crawlers (ETag, Last-Modified, redirects, robots) — stubs extensíveis."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass
class FetchHeaders:
    etag: str | None = None
    last_modified: str | None = None
    content_sha256: str | None = None


def merge_conditional_headers(headers: FetchHeaders, prior: FetchHeaders | None) -> dict[str, Any]:
    """Prepara cabeçalhos If-None-Match / If-Modified-Since para revalidação."""
    out: dict[str, Any] = {}
    if prior and prior.etag:
        out["If-None-Match"] = prior.etag
    if prior and prior.last_modified:
        out["If-Modified-Since"] = prior.last_modified
    if headers.etag:
        out["current_etag"] = headers.etag
    return out


def robots_txt_policy_stub(host: str) -> dict[str, Any]:
    return {"host": host, "respect_robots": True, "crawl_delay_seconds": 1.0, "source": "stub"}
