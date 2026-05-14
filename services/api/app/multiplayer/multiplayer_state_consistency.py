"""Consistência de estado multi-jogador."""

from __future__ import annotations


def consistent_hashes(hashes: list[str]) -> bool:
    return len(set(hashes)) <= 1
