"""Compressão semântica de ramos."""

from __future__ import annotations


def semantic_branch_compress_stub(branches: list[str], *, keep: int) -> list[str]:
    return sorted(set(branches))[:keep]
