"""Modelos partilhados de clientes por publisher."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class PublisherFetchMeta:
    url: str
    etag: str | None
    last_modified: str | None
    content_sha256: str


class PublisherClient(Protocol):
    async def fetch_document(self, url: str) -> tuple[bytes, str, PublisherFetchMeta]: ...
