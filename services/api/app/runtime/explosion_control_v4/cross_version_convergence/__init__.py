"""Convergência cross-version."""

from __future__ import annotations


def cross_version_convergence_stub(hashes: list[str]) -> bool:
    return len(set(hashes)) <= 2
