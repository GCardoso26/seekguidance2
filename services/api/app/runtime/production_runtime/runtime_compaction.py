"""Compactação de runtime."""

from __future__ import annotations


def runtime_compaction_hint(queue_depth: int, *, target: int) -> dict[str, int]:
    return {"before": queue_depth, "after": min(queue_depth, target)}
