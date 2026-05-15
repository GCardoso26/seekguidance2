"""Governança de compactação de replay (stub)."""

from __future__ import annotations

from typing import Any


def replay_compaction_governance_stub(replay_ref: str) -> dict[str, Any]:
    return {
        "replay_ref": replay_ref,
        "compaction_policy": {"lossless_for_judge_hints": True},
        "assistant_notes": ["replay_compaction_governance: pruning só com hashes determinísticos."],
    }
