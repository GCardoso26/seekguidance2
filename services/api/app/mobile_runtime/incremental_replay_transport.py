"""Transporte incremental de replay (stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def incremental_replay_transport_stub(seq: int) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"seq": seq, "next_seq": seq + 1},
        sync_hints=["Retransmitir apenas seq gaps detectados."],
        deterministic_alignment={"monotonic_seq": True},
        mobile_constraints={"window": 8},
        offline_confidence=0.67,
        assistant_notes=["Gaps detectados disparam diagnóstico replay_governance_v2."],
        lineage_replay_slice="irt-v0",
        extras={
            "sync_confidence": 0.7,
            "replay_delta_summary": {"gap": 0},
            "conflict_resolution_notes": [],
            "deterministic_merge_hints": ["fill_gap_from_local_journal"],
        },
    )
