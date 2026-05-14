"""Riftbound — injeção semântica futura."""

from __future__ import annotations

from typing import Any


def riftbound_semantic_injection_stub(tags: list[str]) -> dict[str, Any]:
    return {"injectable": bool(tags), "tags": sorted(tags)}
