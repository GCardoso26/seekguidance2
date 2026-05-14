"""Backpressure de filas (sinais operacionais)."""

from __future__ import annotations

from typing import Any


def queue_backpressure_signal(depth: int, *, soft_limit: int, hard_limit: int) -> dict[str, Any]:
    if depth >= hard_limit:
        level = "hard"
    elif depth >= soft_limit:
        level = "soft"
    else:
        level = "ok"
    return {"depth": depth, "level": level, "soft_limit": soft_limit, "hard_limit": hard_limit}
