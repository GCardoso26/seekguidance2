"""Alinhamento determinístico de sync (stub)."""

from __future__ import annotations

from typing import Any

from app.offline_runtime._offline_payload import offline_judge_payload


def deterministic_sync_alignment_stub(device_a: str, device_b: str) -> dict[str, Any]:
    return offline_judge_payload(
        replay_summary={"device_a": device_a, "device_b": device_b},
        sync_hints=["Ordenar por (device_id, seq) estável."],
        deterministic_alignment={"canonical_order": sorted([device_a, device_b])},
        mobile_constraints={"clock_skew_max_ms": 500},
        offline_confidence=0.57,
        assistant_notes=["Alinhamento não assume equivalência entre TCGs."],
        lineage_replay_slice="dsa-v0",
        offline_limitations=["Relógios locais podem exigir reconciliação humana"],
        sync_conflicts=[],
        replay_alignment={"merged_head": "stub"},
        extras={
            "sync_confidence": 0.6,
            "replay_delta_summary": {},
            "conflict_resolution_notes": [],
            "deterministic_merge_hints": ["stable_device_order"],
        },
    )
