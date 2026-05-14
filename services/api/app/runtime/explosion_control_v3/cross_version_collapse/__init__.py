"""Colapso cross-version (hashes ordenados)."""

from __future__ import annotations


def cross_version_collapse(hashes: list[str]) -> list[str]:
    return sorted(set(hashes))
