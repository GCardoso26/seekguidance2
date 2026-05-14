"""Corpus semântico de replay."""

from __future__ import annotations

from typing import Any


def semantic_replay_corpus_stub(keys: list[str]) -> dict[str, Any]:
    return {
        "indexed": len(set(keys)),
        "replay_equivalence_grouping": [["g1"]],
        "replay_compression_lineage": ["compact_stub"],
        "assistant_notes": ["Soft normalization: sem equivalência forte cross-TCG."],
    }
