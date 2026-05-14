"""Filas de trabalho GPU/embeddings/replay (descritores — workers reais ligam ao arq/redis)."""

from __future__ import annotations

from typing import Any


def queue_descriptor(name: str, priority: int) -> dict[str, Any]:
    return {"queue": name, "priority": priority, "dlq": "ingestion_dlq", "health_probe": "/health"}
