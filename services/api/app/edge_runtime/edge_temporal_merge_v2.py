"""Merge temporal edge v2 (stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def edge_temporal_merge_v2_stub(ticks: int) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"ticks": ticks},
        sync_hints=["Ordenação estável; sem equivalência cross-TCG."],
        deterministic_alignment={"ordering": "stable-v2"},
        mobile_constraints={"max_ticks": 200},
        offline_confidence=0.54,
        assistant_notes=["Temporal edge v2 alinha hardening soft-only."],
        lineage_replay_slice="etmv2",
    )
