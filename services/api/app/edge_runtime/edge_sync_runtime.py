"""Sync no edge (stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def edge_sync_runtime_stub(cursor: str) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"cursor": cursor},
        sync_hints=["Coalescer operações triviais antes de enviar."],
        deterministic_alignment={"next": f"{cursor}+d"},
        mobile_constraints={"inflight_cap": 3},
        offline_confidence=0.54,
        assistant_notes=["Backpressure cooperativo com offline_sync_queue."],
        lineage_replay_slice="edge-sync-v0",
        extras={
            "edge_constraints": {"bandwidth_class": "low"},
            "replay_compaction": {"delta_only": True},
            "deterministic_limits": {"ordered_ops": True},
            "sync_expectations": ["ack_per_slice"],
        },
    )
