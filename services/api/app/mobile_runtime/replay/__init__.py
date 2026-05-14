"""Replay móvel: chunks, lazy load, compaction (stub)."""

from __future__ import annotations

from typing import Any


def mobile_replay_chunk_stub(chunk_id: str, max_bytes: int = 65536) -> dict[str, Any]:
    return {
        "chunk_id": chunk_id,
        "max_bytes": max_bytes,
        "lazy": True,
        "assistant_notes": ["Virtualização de timeline; determinismo preservado por slice."],
    }
