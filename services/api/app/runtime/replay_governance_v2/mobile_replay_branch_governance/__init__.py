"""Governança de ramos de replay móvel (stub)."""

from __future__ import annotations

from typing import Any


def mobile_replay_branch_governance_stub(width: int, cap: int) -> dict[str, Any]:
    return {
        "width": width,
        "cap": cap,
        "assistant_notes": ["Caps cooperam com explosion_control_v5/v6 sem substituir núcleo."],
        "replay_summary": {"pruned": max(0, width - cap)},
        "deterministic_alignment": {"preserve_heads": True},
        "lineage_replay_awareness": {"slice": "mrbg-v0"},
    }
