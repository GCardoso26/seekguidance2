"""Detecção de branching semântico."""

from __future__ import annotations


def detect_branching(paths: list[str]) -> bool:
    return len(paths) > 1
