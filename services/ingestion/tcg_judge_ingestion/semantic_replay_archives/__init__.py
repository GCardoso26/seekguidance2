"""Arquivos semânticos de replay."""

from __future__ import annotations


def semantic_replay_archive_stub(keys: list[str]) -> dict[str, int]:
    return {"indexed": len(set(keys))}
