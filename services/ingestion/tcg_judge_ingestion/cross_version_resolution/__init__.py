"""Resolução cross-version (diff de expectativas)."""

from __future__ import annotations

from typing import Any


def cross_version_resolution_diff(before: dict[str, Any], after: dict[str, Any]) -> list[str]:
    keys = sorted(set(before) | set(after))
    return [k for k in keys if before.get(k) != after.get(k)]
