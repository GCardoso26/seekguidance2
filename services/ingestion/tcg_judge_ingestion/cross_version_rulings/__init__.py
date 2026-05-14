"""Rulings cross-version."""

from __future__ import annotations


def cross_version_stub(ids: list[str]) -> dict[str, int]:
    return {"count": len(ids)}
