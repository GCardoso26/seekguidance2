"""Persistência local de replay e filas de upload (stub)."""

from __future__ import annotations

from typing import Any


def mobile_local_storage_stub(queue_depth: int) -> dict[str, Any]:
    return {
        "queue_depth": queue_depth,
        "corruption_check": True,
        "assistant_notes": ["Detecção local de corrupção; lineage quando sync à cloud opcional."],
    }
