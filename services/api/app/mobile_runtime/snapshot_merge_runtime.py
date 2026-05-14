"""Merge de snapshots (stub determinístico)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def snapshot_merge_runtime_stub(left_v: int, right_v: int) -> dict[str, Any]:
    merged = max(left_v, right_v)
    return judge_mobile_core_payload(
        replay_summary={"left": left_v, "right": right_v, "merged": merged},
        sync_hints=["Rejeitar se hashes de base divergirem."],
        deterministic_alignment={"winner": "max_version_with_same_parent"},
        mobile_constraints={"three_way_required": True},
        offline_confidence=0.52,
        assistant_notes=["Merge assistido; ruling sensível permanece humano."],
        lineage_replay_slice="snap-merge-v0",
        extras={
            "sync_confidence": 0.58,
            "replay_delta_summary": {"merged_versions": 1},
            "conflict_resolution_notes": ([] if left_v == right_v else ["version_skew"]),
            "deterministic_merge_hints": ["tie_break_by_device_id_lexicographic"],
        },
    )
