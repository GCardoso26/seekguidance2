"""Compactação temporal de ramos."""

from __future__ import annotations


def temporal_branch_compaction(branches: list[tuple[int, str]]) -> list[tuple[int, str]]:
    return sorted(set(branches), key=lambda x: (x[0], x[1]))
