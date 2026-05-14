"""Parser bruto → metadados normalizados."""
from __future__ import annotations

from typing import Any

GAME_SLUG = 'fab'


def parse_blob(content_type: str, body: bytes) -> dict[str, Any]:
    return {"game": GAME_SLUG, "content_type": content_type, "bytes": len(body), "status": "stub"}
