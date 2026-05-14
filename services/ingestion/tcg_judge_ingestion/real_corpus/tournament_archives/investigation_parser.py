"""Parser mínimo de relatório de investigação (metadados apenas)."""

from __future__ import annotations

from typing import Any


def parse_investigation_stub(blob: dict[str, Any]) -> dict[str, Any]:
    return {
        "event_id": blob.get("event_id"),
        "has_ruling_text": bool(blob.get("ruling_text")),
        "multiplayer": bool(blob.get("players", [])),
    }
