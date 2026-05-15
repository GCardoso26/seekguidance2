"""Governança de sync móvel (stub)."""

from __future__ import annotations

from typing import Any


def mobile_sync_governance_stub(device_id: str) -> dict[str, Any]:
    return {
        "device_id": device_id,
        "assistant_notes": ["mobile_sync_governance: conflitos classificados; juiz decide merge."],
        "sync_governance_score": 0.79,
        "replay_lineage_hints": {"anchors": []},
    }
