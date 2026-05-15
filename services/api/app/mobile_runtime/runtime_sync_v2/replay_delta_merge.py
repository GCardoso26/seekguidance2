"""replay_delta_merge — runtime sync v2 (mobile-first)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def replay_delta_merge_v2_stub(device_slice: str) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"layer": "replay_delta_merge", "device_slice": device_slice},
        sync_hints=["Merge delta explainable-first; sem auto-ruling jurídico."],
        deterministic_alignment={"token": f"rs2-{device_slice}"},
        mobile_constraints={"compaction": True},
        offline_confidence=0.66,
        assistant_notes=["replay_delta_merge: lineage-aware sync; soft normalization."],
        lineage_replay_slice=f"rs2-{device_slice}",
    )
