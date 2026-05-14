"""Divergência de replay entre versões."""

from __future__ import annotations


def replay_diverged(old_hash: str, new_hash: str) -> bool:
    return old_hash != new_hash
