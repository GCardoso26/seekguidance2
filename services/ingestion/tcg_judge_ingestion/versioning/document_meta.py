"""Metadados de versionamento de documentos (ingestão)."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Any


@dataclass
class DocumentVersionRecord:
    version_label: str | None
    effective_from: date | None
    effective_to: date | None
    content_hash: str
    semantic_hash: str | None = None
    ontology_hash: str | None = None
    document_hash: str | None = None
    diff_summary: dict[str, Any] | None = None
