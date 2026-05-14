"""Profundidade de fila (stub; ligar a Redis length em produção)."""

from __future__ import annotations

from typing import Any

from tcg_judge_ingestion.monitoring.ingestion_metrics import snapshot


def queue_snapshot_stub() -> dict[str, Any]:
    return {"queues": "redis_arq", "metrics": snapshot()}
