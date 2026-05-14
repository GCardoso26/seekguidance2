"""Validação de composições."""

from __future__ import annotations

from typing import Any


def validate_composition(metadata_blocks: list[dict[str, Any]]) -> dict[str, Any]:
    return {"ok": all(bool(b.get("valid", True)) for b in metadata_blocks)}
