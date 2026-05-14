"""Persistência de arestas de grafo de reasoning (payload JSON-serializável)."""

from __future__ import annotations

import hashlib
import json
from typing import Any


def graph_snapshot_id(edges: list[dict[str, Any]]) -> str:
    blob = json.dumps(edges, sort_keys=True, ensure_ascii=False, default=str)
    return hashlib.sha256(blob.encode("utf-8")).hexdigest()


class GraphPersistence:
    def __init__(self) -> None:
        self._snapshots: dict[str, list[dict[str, Any]]] = {}

    def save_edges(self, edges: list[dict[str, Any]]) -> str:
        sid = graph_snapshot_id(edges)
        self._snapshots[sid] = [dict(e) for e in edges]
        return sid

    def load_edges(self, snapshot_id: str) -> list[dict[str, Any]] | None:
        rows = self._snapshots.get(snapshot_id)
        return [dict(r) for r in rows] if rows else None
