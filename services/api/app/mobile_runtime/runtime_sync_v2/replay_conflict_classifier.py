"""replay_conflict_classifier — consistência mobile/offline v3 (incremental)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def replay_conflict_classifier_v3_stub(device_id: str) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"layer": "replay_conflict_classifier", "device_id": device_id},
        sync_hints=["Sync incremental explainable-first; sem runtime jurídico."],
        deterministic_alignment={"token": f"v3-{device_id}"},
        mobile_constraints={"queue": True},
        offline_confidence=0.67,
        assistant_notes=["replay_conflict_classifier: lineage-aware; soft normalization."],
        lineage_replay_slice=f"v3-{device_id}",
    )
