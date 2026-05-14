"""Fingerprinting de documentos (URL + conteúdo + cabeçalhos opcionais)."""

from __future__ import annotations

import hashlib
import json
from typing import Any


def document_fingerprint(
    *,
    source_url: str,
    content_sha256: str,
    headers: dict[str, str] | None = None,
) -> str:
    payload: dict[str, Any] = {"url": source_url.strip(), "sha256": content_sha256}
    if headers:
        payload["etag"] = headers.get("etag") or headers.get("ETag", "")
        payload["last_modified"] = headers.get("last-modified") or headers.get("Last-Modified", "")
    blob = json.dumps(payload, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(blob.encode("utf-8")).hexdigest()


def version_hash(*, content_sha256: str, semantic_hash: str | None, ontology_hash: str | None) -> str:
    parts = [content_sha256, semantic_hash or "", ontology_hash or ""]
    return hashlib.sha256("|".join(parts).encode("utf-8")).hexdigest()
