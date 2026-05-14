"""Execução histórica de replay (aplicação ordenada de passos)."""

from __future__ import annotations

from typing import Any


def execute_historical_replay(steps: list[dict[str, Any]]) -> list[dict[str, Any]]:
    acc: list[dict[str, Any]] = []
    for s in steps:
        acc.append({"applied": dict(s)})
    return acc
