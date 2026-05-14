"""Substituições de política versionadas."""

from __future__ import annotations


def policy_replacement_edges(versions: list[str]) -> list[tuple[str, str]]:
    s = sorted(versions)
    if len(s) < 2:
        return []
    return [(s[i], s[i + 1]) for i in range(len(s) - 1)]
