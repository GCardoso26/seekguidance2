"""Constraints declarativas do scheduler."""

from __future__ import annotations

from typing import Any


def merge_constraints(*blocks: dict[str, Any]) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for b in blocks:
        out.update(b)
    return out
