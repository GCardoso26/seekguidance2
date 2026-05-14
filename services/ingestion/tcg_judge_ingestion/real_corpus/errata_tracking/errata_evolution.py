"""Cadeia de versões de errata (ordenada)."""

from __future__ import annotations


def errata_version_chain(versions: list[str]) -> list[str]:
    return sorted(versions)
