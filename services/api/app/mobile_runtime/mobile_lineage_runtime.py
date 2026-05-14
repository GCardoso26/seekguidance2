"""Lineage temporal local (metadados) — stub."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def mobile_lineage_runtime_stub(event_id: str) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"event_id": event_id, "parents": 1, "branch_depth": 2},
        sync_hints=["Propagar slice_id em cada delta.", "Anexar replay_summary mínimo."],
        deterministic_alignment={"lineage_token": f"lin-{event_id}"},
        mobile_constraints={"max_lineage_depth_mobile": 32},
        offline_confidence=0.61,
        assistant_notes=["Lineage local é vista parcial; servidor mantém grafo completo quando online."],
        lineage_replay_slice=f"lineage-{event_id}",
    )
