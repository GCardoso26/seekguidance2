"""mobile_runtime_delta_merge"""

from __future__ import annotations

from typing import Any


def mobile_runtime_delta_merge_stub(device_id: str) -> dict[str, Any]:
    return {
        "device_id": device_id,
        "sync_recovery_hints": ["retry_with_same_lineage_id"],
        "compact_snapshot_summary": {"pruned": False},
        "replay_delta_integrity": {"ok_stub": True},
        "deterministic_mobile_alignment": {"token": f"dma-{device_id}"},
        "assistant_notes": ["mobile sync resilience; offline-first."],
    }
