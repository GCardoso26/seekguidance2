"""Arquivo histórico versionado (blobs + metadados)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass
class ArchivedBlob:
    content_hash: str
    version_label: str | None
    captured_at: str | None
    uri: str | None


def archival_manifest_entry(blob: ArchivedBlob) -> dict[str, Any]:
    return {
        "content_hash": blob.content_hash,
        "version_label": blob.version_label,
        "captured_at": blob.captured_at,
        "uri": blob.uri,
    }
