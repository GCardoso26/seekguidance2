"""Snapshots semânticos históricos (linhagem por versão de regras)."""

from __future__ import annotations

from typing import Any


class HistoricalSemanticStore:
    def __init__(self) -> None:
        self._by_version: dict[str, list[dict[str, Any]]] = {}

    def record(self, *, version_label: str, semantic_slice: dict[str, Any]) -> None:
        self._by_version.setdefault(version_label, []).append(dict(semantic_slice))

    def lineage_head(self, version_label: str) -> dict[str, Any] | None:
        rows = self._by_version.get(version_label) or []
        return dict(rows[-1]) if rows else None
