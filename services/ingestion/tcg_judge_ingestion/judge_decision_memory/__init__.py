"""Memória de decisões de juiz (metadados auditáveis)."""

from __future__ import annotations

from typing import Any


def append_decision_memory(log: list[dict[str, Any]], decision: dict[str, Any]) -> list[dict[str, Any]]:
    return [*log, decision]
