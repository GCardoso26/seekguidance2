"""Replay através de versões de motor (mapeamento declarativo)."""

from __future__ import annotations

from typing import Any


def map_event_cross_version(ev: dict[str, Any], target_version: str) -> dict[str, Any]:
    out = dict(ev)
    out["mapped_to_version"] = target_version
    return out
