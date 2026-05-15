"""Reconciliação de branches de replay (stub)."""

from __future__ import annotations

from typing import Any


def replay_branch_reconciliation_bridge_stub(replay_ref: str) -> dict[str, Any]:
    return {
        "replay_ref": replay_ref,
        "branch_merge_hints": {"requires_judge": True},
        "assistant_notes": ["replay_branch_reconciliation_bridge: sem auto-merge jurídico."],
    }
