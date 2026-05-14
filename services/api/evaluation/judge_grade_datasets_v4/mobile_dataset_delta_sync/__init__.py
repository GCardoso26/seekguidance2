"""Delta sync de datasets móveis (stub)."""

from __future__ import annotations

from typing import Any


def mobile_dataset_delta_sync_stub(cursor: str) -> dict[str, Any]:
    return {
        "cursor": cursor,
        "assistant_notes": ["Delta apenas com manifesto versionado e hash de base."],
        "replay_summary": {"deltas": 1},
        "deterministic_alignment": {"next": f"{cursor}-d"},
    }
