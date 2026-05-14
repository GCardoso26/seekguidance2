"""Nível de backpressure da ingestão."""

from __future__ import annotations


def ingestion_backpressure_level(queue_depth: int, *, soft: int, hard: int) -> str:
    if queue_depth >= hard:
        return "hard"
    if queue_depth >= soft:
        return "soft"
    return "ok"
