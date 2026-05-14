"""Operações de índice ANN / HNSW (hooks de produção — implementação DB-specific)."""

from __future__ import annotations

from typing import Any


def hnsw_rebuild_plan(*, shard: str, embedding_model: str) -> dict[str, Any]:
    return {"shard": shard, "embedding_model": embedding_model, "steps": ["snapshot", "rebuild", "warm", "cutover"]}


def embedding_lineage_stub(chunk_id: str, model: str) -> dict[str, Any]:
    return {"chunk_id": chunk_id, "model": model, "lineage": "stub"}
