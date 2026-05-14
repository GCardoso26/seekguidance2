"""Snapshots imutáveis de conteúdo (referência por hash)."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ImmutableSnapshot:
    content_sha256: str
    captured_at_iso: str
    source_uri: str | None
