"""Compactação de replay no edge v2 (stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def edge_replay_compaction_v2_stub(events: int, target: int) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"events": events, "target": target, "removed": max(0, events - target)},
        sync_hints=["Compactar antes de sync; preservar heads para resume."],
        deterministic_alignment={"token": "erc2"},
        mobile_constraints={"ratio_soft": 0.4},
        offline_confidence=0.66,
        assistant_notes=["v2 edge: orçamento CPU/bateria cooperativo com mobile."],
        lineage_replay_slice="erc2",
    )
