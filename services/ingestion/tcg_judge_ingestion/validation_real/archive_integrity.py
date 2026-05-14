"""Integridade de arquivo (checksum esperado)."""

from __future__ import annotations


def archive_integrity(expected: str, actual: str) -> dict[str, object]:
    return {"ok": expected == actual, "expected": expected, "actual": actual}
