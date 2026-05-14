"""Diff semântico entre textos de errata (stub)."""

from __future__ import annotations


def semantic_errata_stub(before: str, after: str) -> dict[str, object]:
    return {"semantic_shift": before.strip() != after.strip()}
