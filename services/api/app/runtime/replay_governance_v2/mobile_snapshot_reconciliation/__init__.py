"""Reconciliação de snapshots móveis (stub)."""

from __future__ import annotations

from typing import Any


def mobile_snapshot_reconciliation_stub(a: str, b: str) -> dict[str, Any]:
    return {
        "a": a,
        "b": b,
        "assistant_notes": ["Reconciliação três-vias assistida; juiz confirma divergências."],
        "replay_summary": {"merged": a == b},
        "deterministic_alignment": {"strategy": "common_ancestor_stub"},
        "lineage_replay_awareness": {"slice": "msr-v0"},
    }
