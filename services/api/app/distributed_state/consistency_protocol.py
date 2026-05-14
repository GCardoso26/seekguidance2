"""Protocolo simples de consistência (hash quorum)."""

from __future__ import annotations


def quorum_consistent(hashes: list[str], min_agree: int = 2) -> bool:
    if not hashes:
        return True
    top = max(set(hashes), key=hashes.count)
    return hashes.count(top) >= min_agree
